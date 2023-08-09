const $ = e => document.querySelector(e)
const elem = document.getElementById("3d-graph");
const rootId = 0;

document.addEventListener('DOMContentLoaded', () => {
  render2D()
  const checkbox = $('input[type="checkbox"]');
  checkbox.checked = true;
  checkbox.addEventListener('change', () => checkbox.checked ? render2D() : render3D());
})

function render3D(){  
  const N = 5;
  const GROUPS = 12;
  const distance = 150;

// Random tree
// const gData = {
//   nodes: [...Array(N).keys()].map((i) => ({
//     id: i,
//     collapsed: i !== rootId,
//     group: Math.ceil(Math.random() * GROUPS),
//     childLinks: [],
//   })),
//   links: [...Array(N).keys()]
//     .filter((id) => id)
//     .map((id) => ({
//       source: Math.round(Math.random() * (id - 1)),
//       target: id,
//     })),
// };

// Custom data
const gData = {
  nodes: [
    { id: 0, collapsed: false, group: 1, childLinks: [] },
    { id: 1, collapsed: true, group: 1, childLinks: [] },
    { id: 2, collapsed: true, group: 2, link:"https://www.google.com/", childLinks: [] },
    { id: 3, collapsed: true, group: 2, childLinks: [] },
    { id: 4, collapsed: true, group: 2, childLinks: [] },

  ],
  links: [
    { source: 0, target: 1},
    { source: 1, target: 2},
    { source: 1, target: 3},
    { source: 3, target: 4},
    // { source: 2, target: 4},

  ]
};

// get nodes ID
const nodesById = Object.fromEntries(gData.nodes.map((node) => [node.id, node]) );

// link parent/children
gData.links.forEach((link) => {
  nodesById[link.source].childLinks.push(link);

  const a = gData.nodes[link.source];
  const b = gData.nodes[link.target];
  !a.neighbors && (a.neighbors = []);
  !b.neighbors && (b.neighbors = []);
  a.neighbors.push(b);
  b.neighbors.push(a);

  !a.links && (a.links = []);
  !b.links && (b.links = []);
  a.links.push(link);
  b.links.push(link);
});
  const highlightNodes = new Set();
  const highlightLinks = new Set();
  let hoverNode = null;
// define main object and data
let Graph = ForceGraph3D()(elem)
  //.height(window.innerHeight - 60)
  .graphData(getPrunedTree()) // data to work with
  //.cooldownTicks(200) // cool down time to fit to canvas size

Graph // nodes  
  //.nodeColor(node => highlightNodes.has(node) ? node === hoverNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'rgba(0,255,255,0.6)')
  .nodeAutoColorBy("group")
  .nodeColor((node) => !node.childLinks.length ? "green" : node.collapsed ? "red" : "yellow")
  .nodeLabel("id")
  
Graph //links
  .linkCurvature(0.25) // bezier curve
  .linkCurveRotation(0) // curve toration in radians
  .linkWidth((link) => (highlightLinks.has(link) ? 1 : 1))
  .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 2 : 0)) // qty of particles
  .linkDirectionalParticleWidth(3) // particle width
  .linkOpacity(0.12)
  //.linkAutoColorBy(d => gData.nodes[d.source].group)

Graph // actions  
  .onLinkHover((link) => {
    highlightNodes.clear();
    highlightLinks.clear();

    // if (link) {
    //   highlightLinks.add(link);
    //   highlightNodes.add(link.source);
    //   highlightNodes.add(link.target);
    // }

    updateHighlight();
  })
  .onNodeHover((node) => {
    // no state change
    // if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

    // gData.links.forEach((link) => {
    //   nodesById[link.source].childLinks.push(link);
  
    //   const a = gData.nodes[link.source];
    //   const b = gData.nodes[link.target];
    //   !a.neighbors && (a.neighbors = []);
    //   !b.neighbors && (b.neighbors = []);
    //   a.neighbors.push(b);
    //   b.neighbors.push(a);
  
    //   !a.links && (a.links = []);
    //   !b.links && (b.links = []);
    //   a.links.push(link);
    //   b.links.push(link);
    // });

    elem.style.cursor = node && node.childLinks.length ? "pointer" : null; // show cursor pointer on node
    highlightNodes.clear();
    highlightLinks.clear();    
    
    if (node && node.links) { //highlight links and nodes
      highlightNodes.add(node);
      node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
      node.links.forEach((link) => highlightLinks.add(link));
    }

    hoverNode = node || null;
    updateHighlight();
  })
  // .onNodeDragEnd(node => { // fix node position
  //   node.fx = node.x;
  //   node.fy = node.y;
  //   node.fz = node.z;
  // })
  .onNodeClick((node) => {
    // toggle collapse
    if (node.childLinks.length) {
      node.collapsed = !node.collapsed; // toggle collapse state
      Graph.graphData(getPrunedTree()); // reload data
    }

    // folow the link
   // if (node.link) { if (confirm(`Go to: ${node.link}`)) window.location.href = node.link; }

    // if (confirm(`remove node`)) removeNode(node)

    // // zoom on click
    // if (confirm('Zoom to center node')) {
    //   // Aim at node from outside it
    //   const distance = 40;
    //   const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    //   const newPos = node.x || node.y || node.z
    //     ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
    //     : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    //   Graph.cameraPosition(
    //     newPos, // new position
    //     node, // lookAt ({ x, y, z })
    //     3000  // ms transition duration
    //   );
    // }
  });

// Listen for click events on the canvas
Graph
  .onBackgroundRightClick((node) => {
    // Add a new node to the graph on click
    //const { nodes, links } = Graph.graphData(); // only visible data
    node.id= Graph.graphData().nodes.length;
    addNode(node.id)

    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;

    console.log (node.id)
  });

// fit to canvas when engine stops
//Graph.onEngineStop(() => Graph.zoomToFit(400));
() => {}

// Functions
function getPrunedTree (){
  // collapsed nodes traversing
  const visibleNodes = [];
  const visibleLinks = [];

  (function traverseTree(node = nodesById[rootId]) {
    visibleNodes.push(node);
    if (node.collapsed) return;
    visibleLinks.push(...node.childLinks);
    node.childLinks
      .map((link) => typeof link.target === "object" ? link.target : nodesById[link.target] ) // get child node
      .forEach(traverseTree);
  })(); // IIFE

  return { nodes: visibleNodes, links: visibleLinks };
};

function updateHighlight() {
  // trigger update of highlighted objects in scene
  Graph.nodeColor(Graph.nodeColor())
    .linkWidth(Graph.linkWidth())
    .linkDirectionalParticles(Graph.linkDirectionalParticles());
}

// function addNode(id, nodes, links, collapsed=false, group=1, childLinks=[]){
//   Object.assign(gData, {
//     nodes: [...nodes, { id, collapsed, group, childLinks }],
//     links: [...links, { source: id, target: Math.round(Math.random() * (id-1)) }]
//   })  
//   Graph.graphData({ nodes, links }) 

// }

function addNode(id, collapsed=false, group=1, childLinks=[]){
  let { nodes, links } = Graph.graphData();
  nodes.push({ id, collapsed, group, childLinks })
  links.push({ source: id, target: Math.round(Math.random() * (id-1)) })

  Graph.graphData({ nodes, links }) 

}

function removeNode(node) {
  let { nodes, links } = Graph.graphData();
  links = links.filter((l) => l.source !== node && l.target !== node); // Remove links attached to node
  if (node.id != 0) nodes.splice(node.id, 1); // Remove node
  nodes.forEach((n, idx) => {
    n.id = idx;
  }); // Reset node ids to array index
  Graph.graphData({ nodes, links });
}

// camera orbit
//  let angle = 0;
//   setInterval(() => {
//     Graph.cameraPosition({
//       x: distance * Math.sin(angle),
//       z: distance * Math.cos(angle)
//     });
//     angle += 0.01047197551196597746154214461093 //Math.PI / 300;
//   }, 50);
() => {}

// add plane under the graph
const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x030781, side: THREE.DoubleSide,});
const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
mesh.position.set(-100, -200, -100);
mesh.rotation.set(0.5 * Math.PI, 0, 0);

Graph.scene().add(mesh);

elementResizeDetectorMaker().listenTo(elem, (el) =>  Graph.width(el.offsetWidth));
}

function render2D(){
    // Random tree
    const N = 300;
    const gData = {
      nodes: [...Array(N).keys()].map(i => ({ id: i, collapsed: i !== rootId, childLinks: [] })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: Math.round(Math.random() * (id - 1)),
          target: id
        }))
    };

    // link parent/children
    const nodesById = Object.fromEntries(gData.nodes.map(node => [node.id, node]));
    gData.links.forEach(link => {
      nodesById[link.source].childLinks.push(link);
    });

    const getPrunedTree = () => {
      const visibleNodes = [];
      const visibleLinks = [];

      (function traverseTree(node = nodesById[rootId]) {
        visibleNodes.push(node);
        if (node.collapsed) return;
        visibleLinks.push(...node.childLinks);
        node.childLinks
          .map(link => ((typeof link.target) === 'object') ? link.target : nodesById[link.target]) // get child node
          .forEach(traverseTree);
      })(); // IIFE

      return { nodes: visibleNodes, links: visibleLinks };
    };

    const Graph = ForceGraph()(elem)
      .graphData(getPrunedTree())
      .onNodeHover(node => elem.style.cursor = node && node.childLinks.length ? 'pointer' : null)
      .onNodeClick(node => {
        if (node.childLinks.length) {
          node.collapsed = !node.collapsed; // toggle collapse state
          Graph.graphData(getPrunedTree());
        }
      })
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth(2.5)
      .nodeColor(node => !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'yellow');


}







