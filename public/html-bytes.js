window.addEventListener('load', () =>  {
   const button = document.getElementById('submit');
   button.addEventListener('click', analyze);

   function analyze() {
      const text = document.getElementById('html').value;
      document.body.appendChild(analyzeHtml(text));
   }
});

const percent = new Intl.NumberFormat([], {style: "percent",  maximumFractionDigits: 1});
const bytes = new Intl.NumberFormat([], {style: "unit", unit: "byte", unitDisplay: "short"});

function analyzeHtml(html) {
   const tagToBytes = {};

   const visitNode = (node, parent, parentHtmlLength) => {
      const el = document.createElement('li');
      const className = node.className ? "." + node.className: "";
      const tag = node.tagName.toLowerCase();
      const nodeHtmlLength = node.outerHTML.length;
      const portionOfParent = (nodeHtmlLength / parentHtmlLength) || 1;
      el.innerText = `${percent.format(portionOfParent)} (${bytes.format(nodeHtmlLength)})`;

      const tagEl = document.createElement('tt');
      tagEl.innerText = node.outerHTML.replace(/>.+/s,'>');
      tagEl.classList.add('tag');
      el.appendChild(tagEl);

      if (node.children.length) {
         const list = document.createElement('ul');
         const innerTextLine = buildInnerTextLine(node, nodeHtmlLength);
         innerTextLine && list.appendChild(innerTextLine);
         for (const childNode of node.children) {
            const childEl = visitNode(childNode, node, nodeHtmlLength);
            list.appendChild(childEl);
         }
         el.appendChild(list);
      } else {
         tagToBytes[tag] = (tagToBytes[tag] || 0) + nodeHtmlLength;
         const contents = document.createElement('tt');
         contents.classList.add('contents');
         contents.innerText = node.outerHTML.trim();
         el.classList.add('leaf');
         el.appendChild(contents);
      }
      return el;
   }

   const doc = document.createElement('html');
   doc.innerHTML = html;
   const report = visitNode(doc);
   const container = document.createElement('div');
   const reportContainer = document.createElement('ul');
   container.appendChild(reportContainer);
   container.appendChild(getTagSummary(tagToBytes));
   reportContainer.appendChild(report);
   return container;
}

function buildInnerTextLine(node, parentHtmlLength) {
   let text = '';
   for (var i = 0; i < node.childNodes.length; ++i) {
     if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
       text += node.childNodes[i].textContent;
     }
   }
   if (!text) {
      return null;
   }
   const el = document.createElement('li');
   const portionOfParent = (text.length / parentHtmlLength) || 1;
   el.innerText = `innerText: ${percent.format(portionOfParent)} (${bytes.format(text.length)})`;
   return el;
}

document.addEventListener('click', function(event) {
   if (event.target.tagName == 'LI') {
      event.target.classList.toggle("open");
   }
});

function getTagSummary(tagToBytes) {
   const summaryContainer = document.createElement('div');
   const summaryList = document.createElement('ul');
   summaryContainer.innerText = "Aggregate size over tag types"
   summaryContainer.appendChild(summaryList);
   Object.entries(tagToBytes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tagName, byteCount]) => {
         const tagEl = document.createElement('li');
         tagEl.innerText = `${tagName}: ${bytes.format(byteCount)}`;
         summaryList.appendChild(tagEl);
   });

   return summaryContainer;
}
