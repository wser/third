const $ = e => document.querySelector(e)
const elem = $("#graph");
const checkbox = $('input[type="checkbox"]');
const rootId = 0;
const myData = {
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

let editMode = false;

document.addEventListener('DOMContentLoaded', setScene)

function setScene(){
  render2D()
  lilGUI()
}

//  2D  /////////////////
function render2D(){
  elem.className = '';
  elem.classList.add('_2D');
  // Random tree
  // const N = 50;
  // const gData = {
  //   nodes: [...Array(N).keys()].map(i => ({ 
  //     id: i, 
  //     collapsed: i !== rootId, 
  //     childLinks: [] 
  //   })),
  //   links: [...Array(N).keys()]
  //     .filter(id => id)
  //     .map(id => ({
  //       source: Math.round(Math.random() * (id - 1)),
  //       target: id
  //     }))
  // };

  const gData = structuredClone(myData) //JSON.parse(JSON.stringify(myData)) // deep clone
  // link parent/children
  const nodesById = Object.fromEntries(gData.nodes.map(node => [node.id, node]));
  gData.links.forEach(link => {
    link = {...link, curvature: 0.5}//Math.random().toFixed(2)} // add random link curvature
    nodesById[link.source].childLinks.push(link)
  })

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

  const Graph2D = ForceGraph()(elem)
    .nodeRelSize(8) // change size of nodes
    .graphData(getPrunedTree()) // connect visible children with parents
    .linkCurvature('curvature')
    //.linkCurvature(0.25) // bezier curve
    //.linkCurveRotation(0) // curve toration in radians

  Graph2D // actions on node
    .nodeColor(node => !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'yellow')
    .onNodeHover(node => elem.style.cursor = node && node.childLinks.length ? 'pointer' : null)
    .onNodeClick(node => {
      if (node.childLinks.length) {
        node.collapsed = !node.collapsed; // toggle collapse state
        Graph2D.graphData(getPrunedTree());
      }      
    })
    .onNodeRightClick(node => {
      if (editMode) if (confirm(`remove node`)) removeNode(node.id)  // remove clicked node
    })
    .onNodeDrag(node => {
      console.log (node.id)
      gData.nodes.forEach(node => {
        //if (node.x != undefined) console.log(node.id+":", node.x, node.y)

        let n1 = node.id;
        let n2 = node.id+1;

        collide(n1, n2)

      })

    })
    .onNodeDragEnd(node => { // fix node position
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    })
    
  Graph2D // Listen for right click events on the canvas
    .onBackgroundRightClick((node) => {
      if (!editMode) return;
      // Add a new node to the graph on click
      const { nodes, links } = Graph2D.graphData(); // only visible data
      node.id= Graph2D.graphData().nodes.length;
      if (confirm(`add new node`)) addNode(node.id)
      console.log (node.id)
    });

  function collide(n1, n2) {
    const dx = n1.x - n2.x;
    const dy = n1.y - n2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    const colliding = distance < n1.radius + n2.radius;
    // this.color = colliding ? "green" : "blue";
    console.log(colliding)
  }


    

   
  function addNode(id, collapsed=false, group=1, childLinks=[]){
    let { nodes, links } = Graph2D.graphData();
    nodes.push({ id, collapsed, group, childLinks })
    //links.push({ source: id, target: Math.round(Math.random() * (id-1)) })
  
    Graph2D.graphData({ nodes, links }) 
  
  }

  function removeNode(node) {
    let { nodes, links } = Graph2D.graphData();
    links = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
    if (node.id != 0)nodes.splice(node.id, 1); // Remove node
    nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
    Graph2D.graphData({ nodes, links });
  }
  // resize graph to viewport
  elementResizeDetectorMaker().listenTo(elem, (el) =>  Graph2D.width(el.offsetWidth));

}


//  3D  /////////////////
function render3D(){  
  elem.className = '';
  elem.classList.add('_3D');
  const gData = structuredClone(myData) //JSON.parse(JSON.stringify(myData)) // deep clone

  // const N = 5;
  // const GROUPS = 12;
  // const distance = 150;

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
let Graph3D = ForceGraph3D()(elem)
  //.height(window.innerHeight - 60)
  .backgroundColor("grey")
  .graphData(getPrunedTree()) // data to work with


Graph3D // nodes  
  //.nodeColor(node => highlightNodes.has(node) ? node === hoverNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'rgba(0,255,255,0.6)')
  .nodeAutoColorBy("group")
  .nodeColor((node) => !node.childLinks.length ? "green" : node.collapsed ? "red" : "yellow")
  .nodeLabel("id")
  
Graph3D //links
  .linkCurvature(0.25) // bezier curve
  .linkCurveRotation(0) // curve toration in radians
  .linkWidth((link) => (highlightLinks.has(link) ? 1 : 1))
  .linkDirectionalParticles((link) => (highlightLinks.has(link) ? 2 : 0)) // qty of particles
  .linkDirectionalParticleWidth(3) // particle width
  .linkOpacity(0.12)
  //.linkAutoColorBy(d => gData.nodes[d.source].group)

Graph3D // actions  
  .onLinkHover(link => {
    highlightNodes.clear();
    highlightLinks.clear();

    // if (link) {
    //   highlightLinks.add(link);
    //   highlightNodes.add(link.source);
    //   highlightNodes.add(link.target);
    // }

    updateHighlight();
  })
  .onNodeHover(node => {
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
  .onNodeDragEnd(node => { // fix node position
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  })
  .onNodeClick(node => {
    // toggle collapse
    if (node.childLinks.length) {
      node.collapsed = !node.collapsed; // toggle collapse state
      Graph3D.graphData(getPrunedTree()); // reload data
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

    //   Graph3D.cameraPosition(
    //     newPos, // new position
    //     node, // lookAt ({ x, y, z })
    //     3000  // ms transition duration
    //   );
    // }
  });

// fit to canvas when engine stops
//Graph3D.onEngineStop(() => Graph3D.zoomToFit(400));
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
  Graph3D.nodeColor(Graph3D.nodeColor())
    .linkWidth(Graph3D.linkWidth())
    .linkDirectionalParticles(Graph3D.linkDirectionalParticles());
}

// camera orbit
//  let angle = 0;
//   setInterval(() => {
//     Graph3D.cameraPosition({
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

Graph3D.scene().add(mesh);
// resize to viewport
elementResizeDetectorMaker().listenTo(elem, (el) =>  Graph3D.width(el.offsetWidth));
}


//  CTRL ////////////////
function lilGUI(){
  const gui = new lil.GUI({ title: "Settings" } );

  
  const obj = { 
    '2D / 3D': false, 
    'Edit mode': false
  };
  
  const perspective = gui.addFolder( 'Perspective' );
  perspective
    .add( obj, '2D / 3D' ).onChange( bool => bool ? render3D() : render2D() )
  perspective.close()

  const preferences = gui.addFolder( 'Preferences' );
  preferences
    .add( obj, 'Edit mode' ).onChange( bool => editMode = bool )
  preferences.close()

 
  // gui.add( myObject, 'myBoolean' );  // Checkbox
  // gui.add( myObject, 'myFunction' ); // Button
  // gui.add( myObject, 'myString' );   // Text Field
  // gui.add( myObject, 'myNumber' );   // Number Field
  
  // // Add sliders to number fields by passing min and max
  // gui.add( myObject, 'myNumber', 0, 1 );
  // gui.add( myObject, 'myNumber', 0, 100, 2 ); // snap to even numbers
  
  // // Create dropdowns by passing an array or object of named values
  // gui.add( myObject, 'myNumber', [ 0, 1, 2 ] );
  
  // // Chainable methods
  // // gui.add( myObject, 'myProperty' )
  // //   .name( 'Custom Name' )
  // //   .onChange( value => {
  // //     console.log( value );
  // //   } );
  
  // // Create color pickers for multiple color formats
  // const colorFormats = {
  //   string: '#ffffff',
  //   int: 0xffffff,
  //   object: { r: 1, g: 1, b: 1 },
  //   array: [ 1, 1, 1 ]
  // };
  
  // gui.addColor( colorFormats, 'string' );
  gui.close();
}
