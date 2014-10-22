/** @module dom-utils */

/**
 * This represents a point in a DOM tree that is "in-between" elements or text characters. Just like a real text cursor, this is meant to mark a specific location for adding or manipulating text in DOM tree.
 * @class Cursor
 * @param {Node} node - The DOM node specifying the position in the DOM tree.
 * @param {number} index - If the DOM node is a text node, this represents the exact character index of the DOM position. Otherwise this value is evaluated as boolean: `true` means the cursor is after the node, `false` means it is before it.
 * @property {Node} node
 * @property {number} index
 */
var Cursor =
exports.Cursor = function(node, index) {
	if (!isNode(node)) throw new Error("Expecting node for cursor.");
	this.node = node;
	this.index = index;
	this.length = 2;
}

Cursor.prototype.__proto__ = Array.prototype;

Object.defineProperty(Cursor.prototype, "node", {
	get: function() { return this[0]; },
	set: function(n) {
		if (!isNode(n)) throw new Error("Expecting a node.");
		this[0] = n;
	}
});

Object.defineProperty(Cursor.prototype, "index", {
	get: function() { return this[1]; },
	set: function(n) {
		if (typeof n === "boolean") n = n | 0;
		if (typeof n !== "number" || isNaN(n) || n < 0) {
			throw new Error("Expecting a non-negative integer for the index.");
		}
		this[1] = n;
	}
});

/**
 * Creates a duplicate cursor with same values.
 * @method
 * @returns {Cursor}
 */
Cursor.prototype.clone = function() {
	return new Cursor(this.node, this.index);
}

/**
 * Determines if another cursor can be considered after this cursor in the DOM.
 * @method
 * @param {Cursor} cursor
 * @returns {boolean}
 */
Cursor.prototype.isAfter = function(cursor) {
	cursor = Cursor.toCursor(cursor);
	
	// the same node changes the game
	if (this.node === cursor.node) {
		return this.node.nodeType === Node.TEXT_NODE ?
			this.index > cursor.index :
			this.index ? cursor.index ? false : true : false;
	}

	// where to start looking depends on cursor location
	var node = this.index ? this.node : getPreviousExtendedSibling(this.node);
	
	while (node != null) {
		if (contains(node, cursor.node)) return true;
		node = getPreviousExtendedSibling(node);
	}
	
	return false;
}

/**
 * Determines if another cursor can be considered before this cursor in the DOM.
 * @method
 * @param {Cursor} cursor
 * @returns {boolean}
 */
Cursor.prototype.isBefore = function(cursor) {
	cursor = Cursor.toCursor(cursor);
	
	// the same node changes the game
	if (this.node === cursor.node) {
		return this.node.nodeType === Node.TEXT_NODE ?
			this.index < cursor.index :
			this.index ? false : cursor.index ? true : false;
	}
	
	// where to start looking depends on cursor location
	var node = this.index ? getNextExtendedSibling(this.node) : this.node;
	
	while (node != null) {
		if (contains(node, cursor.node)) return true;
		node = getNextExtendedSibling(node);
	}
	
	return false;
}

/**
 * Moves the cursor.
 * @method
 * @param {Number} offset - The number of text characters to move the cursor by. A negative value moves the cursor in reverse, a positive value will move it forward.
 * @returns {this}
 */
Cursor.prototype.move = function(offset) {
	var count, reverse, node, index, curnode, len;
	
	count = 0;
	reverse = offset < 0;
	offset = Math.abs(offset);
	node = this.node;
	index = this.index;
	
	// determine the true starting node
	if (node.nodeType === Node.TEXT_NODE) {
		// we move the count to maintain index
		count = reverse ? index : Math.max(getTextValue(node).length - index, 0);
	
		// if the count exceeds our max, we've hit the exact position
		if (count > offset) {
			this.index = reverse ? index - offset : index + offset;
			return this;
		}

		// text node lookups never include the current node
		curnode = reverse ? getPreviousExtendedSibling(node) : getNextExtendedSibling(node);
	}
	
	// non-text nodes are all handled the same
	else {
		// check whether to include the node in the count
		curnode = index ? // true means "after", false means "before"
		reverse ? node : getNextExtendedSibling(node) :
		reverse ? getPreviousExtendedSibling(node) : node;
	}
	
	// walk the tree until we find the spot we want
	while (curnode != null) {
		// only count element and text nodes
		if (~[ Node.ELEMENT_NODE, Node.TEXT_NODE ].indexOf(curnode.nodeType)) {
			len = getTextValue(curnode).length;
		
			// check if the length exceeds
			if (count + len > offset) {
				// we "dive" into elements and continue the search
				if (curnode.nodeType === Node.ELEMENT_NODE) {
					curnode = reverse ? curnode.lastChild : curnode.firstChild;
					continue;
				}
				
				// text nodes are the exact position
				index = offset - count;
				this.node = curnode;
				this.index = reverse ? len - index : index;
				return this;
			}
			
			// otherwise bump the count
			else {
				count += len;
			}
		}
		
		// always get the next node
		curnode = reverse ? getPreviousExtendedSibling(curnode) : getNextExtendedSibling(curnode);
	}
	
	// if we got here, it means the offset was out of bounds
	// instead we move the cursor to the very end or beginning of the root
	this.node = getRootNode(node);
	this.index = !reverse;
	return this;
}

/**
 * Determines if a value is DOM cursor
 * @method
 * @param {*} value
 * @returns {boolean}
 */
Cursor.isCursor = function(v) {
	return v instanceof Cursor;
}

/**
 * Converts a value into a cursor.
 * @method
 * @param {Cursor|Node|Array} node
 * @param {*} [index]
 * @returns {boolean}
 */
Cursor.toCursor = function(node, index) {
	if (Cursor.isCursor(node)) return node;
	if (Array.isArray(node)) return new Cursor(node[0], node[1]);
	return new Cursor(node, index);
}

/**
 * Determines if a value is a DOM node.
 * @function
 * @param {*} value - The value to test as a DOM node.
 * @returns {boolean}
 */
var isNode =
exports.isNode = function(node) {
	return node instanceof Node;
}

/**
 * A cross browser compatible solution to testing a DOM element against a CSS selector.
 * @function
 * @param {Node} node - A DOM node to test.
 * @param {string} selector - The CSS selector.
 * @returns {boolean}
 */
var matchesSelector = typeof Element !== "undefined" ?
	Element.prototype.matches ||
	Element.prototype.webkitMatchesSelector ||
	Element.prototype.mozMatchesSelector ||
	Element.prototype.msMatchesSelector :
	function() { return false; };

exports.matchesSelector = function(node, selector) {
	return matchesSelector.call(node, selector)
}

/**
 * Similar to `matchesSelector()`, this method will test a DOM node against CSS selectors, other DOM nodes and functions.
 * @function
 * @param {Node} node - A DOM node to test.
 * @param {string|function|Node} selector - A CSS selector, a function (called with one argument, the node) or a DOM node.
 * @returns {boolean}
 */
var matches =
exports.matches = function(node, selector) {
	if (isNode(selector)) return node === selector;
	if (typeof selector === "function") return !!selector.call(node);
	return matchesSelector.call(node, selector);
}

/**
 * Returns the first descendant node without children.
 * @function
 * @param {Node} node - A DOM node to find the first leaf of.
 * @returns {Node|null}
 */
var getFirstLeafNode =
exports.getFirstLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.firstChild;
	return node;
}

/**
 * Returns the last descendant node without children.
 * @function
 * @param {Node} node - A DOM node to find the last leaf of.
 * @returns {Node|null}
 */
var getLastLeafNode =
exports.getLastLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.lastChild;
	return node;
}

/**
 * Returns the next sibling of this node, or a direct ancestor node's next sibling.
 * @function
 * @param {Node} node - The node to get the next extended sibling of.
 * @returns {Node|null}
 */
var getNextExtendedSibling =
exports.getNextExtendedSibling = function(node) {
	while (node != null) {
		if (node.nextSibling != null) return node.nextSibling;
		node = node.parentNode;
	}

	return null;
}

/**
 * Returns the previous sibling of this node, or a direct ancestor node's previous sibling.
 * @function
 * @param {Node} node - The node to get the previous extended sibling of.
 * @returns {Node|null}
 */
var getPreviousExtendedSibling =
exports.getPreviousExtendedSibling = function(node) {
	while (node != null) {
		if (node.previousSibling != null) return node.previousSibling;
		node = node.parentNode;
	}

	return null;
}

/**
 * Gets the next node in the DOM tree. This is either the first child node, the next sibling node or a direct ancestor node's next sibling.
 * @function
 * @param {Node} node - The node to get the next node of.
 * @returns {Node|null}
 */
var getNextNode =
exports.getNextNode = function(node) {
	return node.hasChildNodes() ? node.firstChild : getNextExtendedSibling(node);
}

/**
 * Gets the previous node in the DOM tree. This will return the previous extended sibling's last, deepest leaf node. This returns the exact opposite result of `getNextNode` (ie `getNextNode(getPreviousNode(node)) === node`).
 * @function
 * @param {Node} node - The node to get the previous node of.
 * @returns {Node|null}
 */
var getPreviousNode =
exports.getPreviousNode = function(node) {
	return node.previousSibling == null ? node.parentNode : getLastLeafNode(node.previousSibling);
}

/**
 * Gets the text value of a node. Basically a concatenation of all text node values.
 * @function
 * @param {Node} node - The node to get the text value of.
 * @returns {string}
 */
var getTextValue =
exports.getTextValue = function(node) {
	switch(node.nodeType) {
		case Node.ELEMENT_NODE: return node.innerHTML || node.textContent || "";
		case Node.TEXT_NODE: return node.nodeValue || "";
		default: return "";
	}
}

/**
 * Returns the root node of a DOM tree.
 * @function
 * @param {Node} node - A node in the DOM tree you need the root of.
 * @returns {Node}
 */
var getRootNode =
exports.getRootNode = function(node) {
	while (node.parentNode != null) {
		node = node.parentNode
	}
	
	return node;
}

/**
 * Determines if a node is a direct ancestor of another node.
 * @function
 * @param {Node} parent - The ancestor node.
 * @param {Node} node - The node which may or may not be a descendant of the parent.
 * @returns {boolean}
 */
var contains =
exports.contains = function(parent, node) {
	while (node != null) {
		if (matches(node, parent)) return true;
		node = node.parentNode;
	}
	
	return false;
}

/**
 * Returns a cloned copy of the all DOM content between two cursors.
 * @function
 * @param {Cursor|null} start - The cursor to start at. Pass null to slice from the beginning of the root.
 * @param {Cursor|null} end - The cursor to end at. Pass null to slice until the end of the root.
 * @param {Node} [root] - Any common ancestor between the starting node and the ending node. If not passed, it will use the outermost root node.
 * @returns {Node}
 */
var slice =
exports.slice = function(start, end, root) {
	var swap, extract;
	
	// convert start and end to cursors
	start = start == null ? null : Cursor.toCursor(start);
	end = end == null ? null : Cursor.toCursor(end);

	// get the true root
	if (root == null) {
		if (start == null || end == null) throw new Error("Must specify a root node if start and end cursors are not defined.");
		root = getRootNode(start == null ? end.node : start.node);
	}

	// resolve the start and end if they are null
	if (!start) start = new Cursor(root, false);
	if (!end) end = new Cursor(root, true);

	// make sure the start and end are in bounds
	if (!contains(root, start.node)) throw new Error("Start node isn't in the root node.");
	if (!contains(root, end.node)) throw new Error("End node isn't in the root node.");

	// swap the start and end if they are in the wrong order
	if (start.isAfter(end)) {
		swap = start;
		start = end;
		end = swap;
	}
	
	return (extract = function(node) {
		// check if this node wraps or is inside of the start and end nodes
		if (contains(node, start.node) || contains(node, end.node) || (start.isBefore(node) && end.isAfter(node))) {
			var clone = node.cloneNode(false);
			
			// make sure to chop end text nodes properly
			if (node.nodeType === Node.TEXT_NODE) {
				var text = node.nodeValue;
				
				if (matches(node, start.node)) {
					text = text.substr(start.index);
				}
			
				if (matches(node, end.node)) {
					text = text.substr(0, end.index);
				}
				
				clone.nodeValue = text;
			}
			
			// recursively clone children
			if (node.hasChildNodes()) {
				Array.prototype.slice.call(node.childNodes, 0).forEach(function(child) {
					var nc = extract(child);
					if (nc != null) clone.appendChild(nc);
				});
			}
			
			return clone;
		}
	})(root);
}