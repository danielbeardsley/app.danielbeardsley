window.addEventListener('load', () =>  {
   const button = document.getElementById('submit');
   button.addEventListener('click', analyze);

   function analyze() {
      const text = document.getElementById('html').value;

      const doc = document.createElement('html');
      doc.innerHTML = text;
      const report = visitNode(doc);
      const reportContainer = document.createElement('ul');
      reportContainer.appendChild(report);
      document.body.appendChild(reportContainer);
   }
});

function visitNode(node, parent, indent = 0) {
   const el = document.createElement('li');
   el.innerText = node.tagName + ": " + node.outerHTML.length;

   if (node.children.length) {
      el.innertText = node.tagName + ": " + node.outerHTML.length;
      const list = document.createElement('ul');
      for (const childNode of node.children) {
         const childEl = visitNode(childNode, node, indent + 2);
         list.appendChild(childEl);
      }
      el.appendChild(list);
   }
   return el;
}

document.addEventListener('click', function(event) {
   if (event.target.tagName == 'LI') {
      event.target.classList.toggle("open");
   }
});
