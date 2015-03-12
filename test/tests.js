var DOMUtils = require("../");
var expect = require("./utils/expect");

describe("DOM Utilities", function() {

	describe("matches", function() {
		var div;

		beforeEach(function() {
			div = document.createElement("div");
		});

		it("matchesSelector() matches an element by CSS selector", function() {
			expect(DOMUtils.matchesSelector(div, "div")).to.be.ok;
			expect(DOMUtils.matchesSelector(div, "#myid")).to.not.be.ok;
		});

		it("matches() matches an element by CSS selector", function() {
			expect(DOMUtils.matches(div, "div")).to.be.ok;
			expect(DOMUtils.matches(div, "#myid")).to.not.be.ok;
		});

		it("matches() matches a node against another node", function() {
			expect(DOMUtils.matches(div, div)).to.be.ok;
			expect(DOMUtils.matches(div, document.createElement("div"))).to.not.be.ok;
		});
	});

	describe("iterators", function() {
		it("getNextNode() returns the first child of a non-leaf node.", function() {
			var cont = document.createDocumentFragment(),
				div = cont.appendChild(document.createElement("div"));

			expect(DOMUtils.getNextNode(cont)).to.equal(div);
		});

		it("getNextNode() returns the next sibling node if the node is a leaf node.", function() {
			var cont = document.createDocumentFragment(),
				div1 = cont.appendChild(document.createElement("div")),
				div2 = cont.appendChild(document.createElement("div"));

			expect(DOMUtils.getNextNode(div1)).to.equal(div2);
		});

		it("getNextNode() returns the a parent's next sibling node if this is a leaf node and has no siblings.", function() {
			var cont = document.createDocumentFragment(),
				parent1 = cont.appendChild(document.createElement("div")),
				parent2 = cont.appendChild(document.createElement("div")),
				div = parent1.appendChild(document.createElement("div"));

			expect(DOMUtils.getNextNode(div)).to.equal(parent2);
		});

		it("getNextNode() returns null if there are no more nodes in the tree.", function() {
			var cont = document.createDocumentFragment(),
				div = cont.appendChild(document.createElement("div"));

			expect(DOMUtils.getNextNode(div)).to.equal(null);
		});

		it("getPreviousNode() returns the deepest, last child of the previous sibling node.", function() {
			var cont = document.createDocumentFragment(),
				div1 = cont.appendChild(document.createElement("div")),
				div2 = cont.appendChild(document.createElement("div")),
				child1 = div1.appendChild(document.createElement("div")),
				child2 = div1.appendChild(document.createElement("div")),
				childchild = child2.appendChild(document.createElement("div"));

			expect(DOMUtils.getPreviousNode(div2)).to.equal(childchild);
		});

		it("getPreviousNode() returns the parent node if there are no previous siblings.", function() {
			var cont = document.createDocumentFragment(),
				div1 = cont.appendChild(document.createElement("div"));

			expect(DOMUtils.getPreviousNode(div1)).to.equal(cont);
		});

		it("getPreviousNode() returns null if it is the first node in the tree.", function() {
			var cont = document.createDocumentFragment(),
				div = cont.appendChild(document.createElement("div"));

			expect(DOMUtils.getPreviousNode(cont)).to.equal(null);
		});
	});

});