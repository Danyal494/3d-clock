import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';  // Correct import for OrbitControls
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';  // Correct import for RGBELoader
import { PMREMGenerator } from 'three';  // PMREMGenerator comes from THREE

let scene = new THREE.Scene();
scene.background = new THREE.Color("black");

let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.LinearEncoding;

document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

let pmrem = new PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

let mousePos = new THREE.Vector2(0,0)
window.addEventListener("mousemove", (e) => {
    let x = e.clientX - innerWidth * 0.5;
    let y = e.clientY - innerHeight * 0.5;

    // console.log("x:" + x + " y:" + y);

mousePos.x = x * 0.001
mousePos.y = y * 0.001

});

(async function init() {
    let envHdrTexture = await new RGBELoader().loadAsync("./assets/cannon_1k_blurred.hdr");
    let envRT = pmrem.fromEquirectangular(envHdrTexture);

    
let ring1 = CustomRing(envRT,0.65,"white")
ring1.scale.set(0.75,0.75)
scene.add(ring1)
let ring2 = CustomRing(envRT,0.35,new THREE.Color(0.25,0.225,0.215))
ring2.scale.set(1.05,1.05)
scene.add(ring2)
let ring3 = CustomRing(envRT,0.15,new THREE.Color(0.7,0.7,0.7))
ring3.scale.set(1.3,1.3)
scene.add(ring3)
  

let hourLine = CustomLine(0.4,0.135,0.07,envRT,"white",3)
scene.add(hourLine)

let minutesLine = CustomLine(0.8,0.135,0.07,envRT,new THREE.Color(0.5,0.5,0.5),1)
scene.add(minutesLine)
let secondsLine = CustomLine(1,0.075,0.07,envRT,new THREE.Color(0.2,0.2,0.2),3)
scene.add(secondsLine)

// scene.add(
//     CustomLine(0.4,0.135,0.07,envRT,"white",3)
// )

let cLines = clockLines(envRT)
scene.add(cLines)

    renderer.setAnimationLoop(() => {
ring1.rotation.x = ring1.rotation.x * 0.95 + (mousePos.y *1.2) *0.05 //in this we are first dividing the 50% of orignal target and than we are adding the orignal ring rotation for smooth delay 
ring1.rotation.y = ring1.rotation.y * 0.95 + (mousePos.x *1.2) *0.05
ring2.rotation.x = ring2.rotation.x * 0.95 + (mousePos.y *0.375) *0.05
ring2.rotation.y = ring2.rotation.y * 0.95 + ( mousePos.x *0.375) *0.05
ring3.rotation.x =  ring3.rotation.x * 0.95 - (mousePos.y *0.275) *0.05
ring3.rotation.y =  ring3.rotation.y * 0.95 - (mousePos.x *0.275) *0.05

let date = new Date()
let hourAngle = date.getHours()/12 * Math.PI *2
// hourLine.rotation.z = -hourAngle
// hourLine.position.set(Math.sin(hourAngle), Math.cos(hourAngle),0)
rotationLine(hourLine,hourAngle,ring1.rotation,1.0,0)

let minutesAngle = date.getMinutes()/60 * Math.PI *2
// minutesLine.rotation.z = -minutesAngle
// minutesLine.position.set(Math.sin(minutesAngle), Math.cos(minutesAngle),0)
rotationLine(minutesLine,minutesAngle,ring1.rotation,0.8,0.1)

let secondsAngle = date.getSeconds()/60 * Math.PI *2
// secondsLine.rotation.z = -secondsAngle
// secondsLine.position.set(Math.sin(secondsAngle), Math.cos(secondsAngle),0)
rotationLine(secondsLine,secondsAngle,ring1.rotation,0.75,-0.1)

cLines.children.forEach((c,i) =>{
    rotationLine(c,i/12*Math.PI * 2, ring1.rotation,1.72,0.2)
})

        controls.update();  // Make sure to update controls during the render loop
        renderer.render(scene, camera);
    });
})();

function rotationLine ( line,angle,ringRotation,topTranslation,depthTranslation){
    let tmatrix = new THREE.Matrix4().makeTranslation(0,topTranslation,depthTranslation)
    let rmatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1) ,-angle)
    let r1matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler().copy(ringRotation))

    line.matrix.copy(new THREE.Matrix4().multiply(r1matrix).multiply(rmatrix).multiply(tmatrix))
    line.matrixAutoUpdate = false
    line.matrixWorldNeedsUpdate = false
}


function CustomRing(envRT,thickness,color) {
    let ring = new THREE.Mesh(
        new THREE.RingGeometry(2,2 +thickness , 70),
        new THREE.MeshStandardMaterial({
            envMap: envRT.texture,
            roughness: 0,
            metalness: 1,
            side:THREE.DoubleSide,color,envMapIntensity:1
        })
    )
    ring.position.set(0,0,0.25*0.5)
    let innerring = new THREE.Mesh(
        new THREE.RingGeometry(2,2 +thickness , 70),
        new THREE.MeshStandardMaterial({
            envMap: envRT.texture,
            roughness: 0,
            metalness: 1,
            side:THREE.DoubleSide,color,envMapIntensity:1
        })
    )
    innerring.position.set(0,0,-0.25*0.5)

    let outerCylinder  = new THREE.Mesh(
        new THREE.CylinderGeometry(2+thickness,2+thickness,0.25,70,1,true),
        new THREE.MeshStandardMaterial({
            envMap: envRT.texture,
            roughness: 0,
            metalness: 1,
            side:THREE.DoubleSide,color,envMapIntensity:1
        })
        
    )
    outerCylinder.rotation.x = Math.PI * 0.5

    let innerCylinder  = new THREE.Mesh(
        new THREE.CylinderGeometry(2,2,0.25,140,1,true),
        new THREE.MeshStandardMaterial({
            envMap: envRT.texture,
            roughness: 0,
            metalness: 1,
            side:THREE.DoubleSide,color,
            envMapIntensity:1
        })
        
    )
    innerCylinder.rotation.x = Math.PI * 0.5

let group = new THREE.Group()
group.add(innerring,ring,outerCylinder,innerCylinder)

    return group
}


function CustomLine(height,width,depth,envRT,color,envMapIntensity){
let box = new THREE.Mesh(
    new THREE.BoxGeometry(width,height,depth),
    new THREE.MeshStandardMaterial({ envMap: envRT.texture,
        roughness: 0,
        metalness: 1,
        side:THREE.DoubleSide,color,
        envMapIntensity})
)
box.position.set(0,0,0)

let topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(width *0.5 , width*0.5 , depth , 10),
    new THREE.MeshStandardMaterial({envMap: envRT.texture,
        roughness: 0,
        metalness: 1,
        side:THREE.DoubleSide,color,
        envMapIntensity
    })
)
topCap.rotation.x = Math.PI *0.5
topCap.position.set(0,+height*0.5,0)

let bottomCap = new THREE.Mesh(
    new THREE.CylinderGeometry(width *0.5 , width*0.5 , depth , 10),
    new THREE.MeshStandardMaterial({envMap: envRT.texture,
        roughness: 0,
        metalness: 1,
        side:THREE.DoubleSide,color,
        envMapIntensity
    })
)
bottomCap.rotation.x = Math.PI *0.5
bottomCap.position.set(0,-height*0.5,0)

let group = new THREE.Group()
group.add(box , topCap, bottomCap)

    return group


}


function clockLines(envRT){
    let group = new THREE.Group()

    for(let i=0 ; i < 12; i++){
        let line = CustomLine(0.1,0.075,0.025,envRT,new THREE.Color(0.65,0.65,0.65),1)

        group.add(line)
    }

    return group
}