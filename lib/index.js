/**
 * # DOM Utilities
 *
 * This is a collection of common utility methods for the DOM. While similar in nature to libraries like jQuery, this library aims to provide methods for unique and odd features.
 */

/**
 * ## Cursor
 *
 * This represents a point in a DOM tree that is "in-between" elements or text characters. Just like a real text cursor, this is meant to mark a specific location for adding or manipulating text in DOM tree.
 *
 * Cursor extends the JavaScript Array class, so all the methods available to arrays are also available to Cursor. Unlike normal arrays, however, cursors have a fixed size of two.
 *
 * As an example, here is a cursor which marks the beginning of the document body:
 *
 * ```javascript
 * var cursor = new domUtils.Cursor(document.body, false);
 * ```
 *
 * #### Arguments
 *
 * - **node** _Node_ - The DOM node specifying the position in the DOM tree.
 * - **index** _integer_ - This represents the exact character index of the DOM position. If the DOM node is a text node, this is the index of the `nodeValue` string. Otherwise, this acts like a boolean, stating which side of the element the cursor should appear on. In this case `true` means "after" and `false` means "before".
 */
var Cursor =
exports.Cursor = function(node, index) {
	if (!isNode(node)) throw new Error("Expecting node for cursor.");
	this.node = node;
	this.index = index;
	this.length = 2;
}

// extends Array, as best as JS allows
Cursor.prototype.__proto__ = Array.prototype;

/**
 * ### Instance Properties
 *
 * - **cursor.node** _Node_ - A DOM node.
 * - **cursor.index** _integer_ - The exact character index of the DOM position.
 */
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
		if (n == null) n = 0;
		if (typeof n === "boolean") n = n ? 1 : 0;
		if (typeof n !== "number" || isNaN(n) || n < 0) {
			throw new Error("Expecting a non-negative integer for the index.");
		}
		this[1] = n;
	}
});

/**
 * ### Cursor#clone()
 *
 * Creates a duplicate cursor with same values.
 */
Cursor.prototype.clone = function() {
	return new Cursor(this.node, this.index);
}

/**
 * ### Cursor#isAfter()
 *
 * Determines if another cursor can be considered after this cursor in the DOM.
 *
 * #### Arguments
 *
 * - **cursor** _Cursor_ - A cursor to determine the position of relative to this one.
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
 * ### Cursor#isBefore()
 *
 * Determines if another cursor can be considered before this cursor in the DOM.
 *
 * #### Arguments
 *
 * - **cursor** _Cursor_ - A cursor to determine the position of relative to this one.
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
 * ### Cursor#move()
 *
 * Moves the cursor from it's current position by a character offset. This method returns `this` for method chaining.
 *
 * #### Arguments
 *
 * - **offset** _integer_ - The number of text characters to move the cursor by. A negative value moves the cursor in reverse, a positive value will move it forward.
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
		count = reverse ? index : Math.max(getTextContent(node).length - index, 0);
	
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
			len = getTextContent(curnode).length;
		
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
 * ### Cursor.isCursor()
 *
 * Determines if a value is DOM cursor.
 *
 * #### Arguments
 *
 * - **value** _mixed_ - A value to check as an isntance of Cursor.
 */
Cursor.isCursor = function(v) {
	return v instanceof Cursor;
}

/**
 * ### Cursor.toCursor()
 *
 * Converts a value into a cursor. This is mainly so a type check isn't necessary when accepting both cursors and arrays.
 *
 * #### Arguments
 *
 * - **node** _Cursor | Node | Array_ - A value to convert to a cursor.
 * - **index** _integer; optional_ - The index of the cursor.
 */
Cursor.toCursor = function(node, index) {
	if (Cursor.isCursor(node)) return node;
	if (Array.isArray(node)) return new Cursor(node[0], node[1]);
	return new Cursor(node, index);
}

/**
 * ## isNode()
 *
 * Determines if a value is a DOM node.
 *
 * #### Arguments
 *
 * - **value** _mixed_ - A value to test as a DOM node.
 */
var isNode =
exports.isNode = function(node) {
	return node instanceof Node;
}

/**
 * ## matchesSelector()
 *
 * A cross browser compatible solution to testing a DOM element against a CSS selector.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to test.
 * - **selector** _string_ - A CSS selector.
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
 * ## matches()
 *
 * Similar to `matchesSelector()`, this method will test a DOM node against CSS selectors, other DOM nodes and functions.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to test.
 * - **selector** _string | function | Node_ - A CSS selector, a function (called with one argument, the node) or a DOM node.
 */
var matches =
exports.matches = function(node, selector) {
	if (isNode(selector)) return node === selector;
	if (typeof selector === "function") return !!selector.call(node);
	return matchesSelector.call(node, selector);
}

/**
 * ## getFirstLeafNode()
 *
 * Returns the first descendant node without children or `null` if doesn't exist.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to find the first leaf of.
 */
var getFirstLeafNode =
exports.getFirstLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.firstChild;
	return node;
}

/**
 * ## getLastLeafNode()
 *
 * Returns the last descendant node without children or `null` if doesn't exist.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to find the last leaf of.
 */
var getLastLeafNode =
exports.getLastLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.lastChild;
	return node;
}

/**
 * ## getNextExtendedSibling()
 *
 * Returns the next sibling of this node, a direct ancestor node's next sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the next extended sibling of.
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
 * ## getPreviousExtendedSibling()
 *
 * Returns the previous sibling of this node, a direct ancestor node's previous sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the previous extended sibling of.
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
 * ## getNextNode()
 *
 * Gets the next node in the DOM tree. This is either the first child node, the next sibling node, a direct ancestor node's next sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the next node of.
 */
var getNextNode =
exports.getNextNode = function(node) {
	return node.hasChildNodes() ? node.firstChild : getNextExtendedSibling(node);
}

/**
 * ## getPreviousNode()
 *
 * Gets the previous node in the DOM tree. This will return the previous extended sibling's last, deepest leaf node or `null` if doesn't exist. This returns the exact opposite result of `getNextNode` (ie `getNextNode(getPreviousNode(node)) === node`).
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the previous node of.
 */
var getPreviousNode =
exports.getPreviousNode = function(node) {
	return node.previousSibling == null ? node.parentNode : getLastLeafNode(node.previousSibling);
}

/**
 * ## getTextContent()
 *
 * Gets the text content of a node and its descendants. This is the text content that is visible to a user viewing the HTML from browser. Hidden nodes, such as comments, are not included in the output.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the text content of.
 */
var getTextContent =
exports.getTextContent = function(node) {
	if (Array.isArray(node)) return node.map(getTextContent).join("");

	switch(node.nodeType) {
		case Node.DOCUMENT_NODE:
		case Node.DOCUMENT_FRAGMENT_NODE:
			return getTextContent(Array.prototype.slice.call(node.childNodes, 0));

		case Node.ELEMENT_NODE:
			if (typeof node.innerText === "string") return node.innerText;		// webkit
			if (typeof node.textContent === "string") return node.textContent;	// firefox
			return getTextContent(Array.prototype.slice.call(node.childNodes, 0));// other
		
		case Node.TEXT_NODE:
			return node.nodeValue || "";

		default:
			return "";
	}
}

/**
 * ## getRootNode()
 *
 * Returns the root node of a DOM tree.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node in the DOM tree you need the root of.
 */
var getRootNode =
exports.getRootNode = function(node) {
	while (node.parentNode != null) {
		node = node.parentNode
	}
	
	return node;
}

/**
 * ## contains()
 *
 * Determines if a node is a direct ancestor of another node. This is the same syntax as jQuery's `$.contains()`.
 *
 * #### Arguments
 *
 * - **parent** _Node_ - The ancestor node.
 * - **node** _Node_ - The node which may or may not be a descendant of the parent.
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
 * ## slice()
 *
 * Returns a cloned copy of the all DOM content between two cursors.
 *
 * #### Arguments
 *
 * - **start** _Cursor | null_ - The cursor to start at. Pass null to slice from the beginning of the root.
 * - **end** _Cursor | null_ - The cursor to end at. Pass null to slice until the end of the root.
 * - **root** _Node; optional_ - Any common ancestor between the starting node and the ending node. If not passed, it will use the outermost root node.
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
				var text = node.nodeValue,
					isStart = matches(node, start.node),
					isEnd = matches(node, end.node);
				
				if (isStart && isEnd) {
					text = text.substring(start.index, end.index);
				} else if (isStart) {
					text = text.substr(start.index);
				} else if (isEnd) {
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