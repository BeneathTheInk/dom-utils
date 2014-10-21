/** @module dom-utils */

/**
 * An exact DOM position. This is either a DOM node or an array with the Node and character offset.
 * @typedef Position
 * @type {Array|Node}
 * @property {Node} 0 - The DOM node specifying the position in the DOM tree.
 * @property {number} 1 - If the DOM node is a text node, this represents the exact character index of the DOM position. Otherwise, this value is ignored unless specified.
 */

/**
 * Retrieve the next node. This is either the next sibling, or a parent node's next sibling.
 * @function
 * @param {Node} node - The node to get the next node of.
 * @returns {Node|null}
 */
var getNextNode =
exports.getNextNode = function(node) {
	while (node != null) {
		if (node.nextSibling != null) return node.nextSibling;
		node = node.parentNode;
	}

	return null;
}

/**
 * Retrieve the previous node. This is either the previous sibling, or a parent node's previous sibling.
 * @function
 * @param {Node} node - The node to get the previous node of.
 * @returns {Node|null}
 */
var getPreviousNode =
exports.getPreviousNode = function(node) {
	if (node.previousSibling != null) return node.previousSibling;
	if (node.parentNode != null) return node.parentNode.previousSibling;
	return null;
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
 * Determines if the node is an element node or a text node.
 * @function
 * @param {Node} node - The node to determine the type of.
 * @returns {boolean}
 */
var isElementOrTextNode =
exports.isElementOrTextNode = function(node) {
	return !!~[ Node.ELEMENT_NODE, Node.TEXT_NODE ].indexOf(node.nodeType);
}

/**
 * This method finds the exact position that is a certain number of characters away from a starting DOM position. A negative number will find a position before the start, a positive number will find the position after. If the position marks an element node, pass true (or any positive number) for the position's index to include the element node in the count. Otherwise, the count will always start before or after the element node. If this method returns null, that means that the offset was greater than the bounds of the document.
 * @function
 * @param {Position} pos - The DOM position to begin counting from.
 * @param {number} offset - The number of characters to count away from the position.
 * @returns {Position|null}
 */
var getTextNodeAtOffset =
exports.getTextNodeAtOffset = function(pos, offset) {
	var count, reverse, node, index, curnode, len;
	
	count = 0;
	reverse = offset < 0;
	offset = Math.abs(offset);
	
	// accept array or node for position
	if (Array.isArray(pos)) {
		node = pos[0];
		index = pos[1];
	} else {
		node = pos;
		index = 0;
	}
	
	// make sure we are dealing with a real DOM node
	if (!(node instanceof Node)) {
		throw new Error("Expecting DOM node for position.");
	}
	
	// determine the true starting node
	if (node.nodeType === Node.TEXT_NODE) {
		// we move the count to maintain index
		count = reverse ? index : Math.max(getTextValue(node).length - index, 0);
		if (count > offset) return [ node, reverse ? index - offset : index + offset ];

		// text node lookups never include the current node
		curnode = reverse ? getPreviousNode(node) : getNextNode(node);
	}
	
	// non-text nodes are all handled the same
	else {
		// check whether to include the node in the count
		curnode = index ? node : reverse ? getPreviousNode(node) : getNextNode(node);
	}
	
	// walk the tree until we find the spot we want
	while (curnode != null) {
		// only count element and text nodes
		if (isElementOrTextNode(curnode)) {
			len = getTextValue(curnode).length;
			
			// check if the length exceeds
			if (count + len > offset) {
				// we "dive" into elements and continue the search
				if (curnode.nodeType === Node.ELEMENT_NODE) {
					curnode = reverse ? curnode.lastChild : curnode.firstChild;
					continue;
				}
				
				// text nodes are the exact position
				return [ curnode, offset - count ];
			}
			
			// otherwise bump the count
			else {
				count += len;
			}
		}
		
		// always get the next node
		curnode = reverse ? getPreviousNode(curnode) : getNextNode(curnode);
	}
	
	// this means the offset was out of bounds
	return null;
}