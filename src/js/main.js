var container = document.createElement('div');
document.body.appendChild(container);

var aspect = window.innerWidth / window.innerHeight;
camera = new THREE.OrthographicCamera(
  frustumSize * aspect / - 2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  frustumSize / - 2,
  1,
  1000
);

var scene = new THREE.Scene();

var light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 1, 1, 1 ).normalize();
scene.add( light );

var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
