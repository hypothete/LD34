(function(THREE){
	'use strict';

	var renderer = new THREE.WebGLRenderer({
			antialias: true
		}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000),
		spot = new THREE.SpotLight(0xfffff0, 1),
		size = 7,
		walls = new MakeRoomBounds(size),
		wallBounds= new THREE.BoundingBoxHelper(walls, 0xff00ff),
		playerBCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(3,0,3),new THREE.Vector3(3,1,3)]),
		playerB = new Player(playerBCurve),
		keys = {};

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.position.set(-9,5,-9);
	camera.lookAt(new THREE.Vector3(3,3,3));
	spot.position.set(-15,8,-15);

	scene.add(spot,walls,wallBounds, playerB);
	wallBounds.update();
	wallBounds.visible = false;
	animate();

	window.addEventListener('keydown', function(e){
		keys[e.keyCode] = true;
	});

	window.addEventListener('keyup', function(e){
		keys[e.keyCode] = false;
	});

	function animate(){
		window.requestAnimationFrame(animate);
		if(keys[83]){

			var bNeighbors = getCurveNeighbors(playerBCurve.points),
				randIndexB = Math.round(Math.random()*(bNeighbors.length-1)),
				randNbr = bNeighbors[randIndexB];
			if(randNbr !== true && wallBounds.box.containsPoint(randNbr)){
				playerBCurve.points.push(randNbr);
				playerB.geometry.dispose();
				playerB.geometry = new THREE.TubeGeometry(playerBCurve, playerBCurve.points.length*3, 0.25,6);
			}
		}
		else if(keys[87] && playerBCurve.points.length > 2){
			playerBCurve.points.length --;
			playerB.geometry.dispose();
			playerB.geometry = new THREE.TubeGeometry(playerBCurve, playerBCurve.points.length*3, 0.25,6);
		}

		renderer.render(scene, camera);
	}

	function isPointInCurve(point, pts){
		var rtnVal = point;
		pts.forEach(function(pt){
			if(pt.equals(point)){
				rtnVal = true;
			}
		});
		return rtnVal;
	}

	function getCurveNeighbors(pointsList){
		var last = pointsList[pointsList.length-1],
			nbrs = [
			isPointInCurve(new THREE.Vector3(last.x+1,last.y,last.z), pointsList),
			isPointInCurve(new THREE.Vector3(last.x-1,last.y,last.z), pointsList),
			isPointInCurve(new THREE.Vector3(last.x,last.y+1,last.z), pointsList),
			isPointInCurve(new THREE.Vector3(last.x,last.y-1,last.z), pointsList),
			isPointInCurve(new THREE.Vector3(last.x,last.y,last.z+1), pointsList),
			isPointInCurve(new THREE.Vector3(last.x,last.y,last.z-1), pointsList)
		];
		return nbrs;
	}

	function MakeRoomBounds(size){
		var roomMat = new THREE.MeshStandardMaterial({
				side: THREE.BackSide,
				color: 0x7799ee,
				roughness: 0.2,
				metalness: 0.1
			}),
			roomGeo = new THREE.BoxGeometry(size+1,size+1,size+1),
			roomMesh = new THREE.Mesh(roomGeo, roomMat);
			roomMesh.position.set(size/2,size/2,size/2);
		return roomMesh;
	}

	function Player(curve){
		var p = new THREE.Mesh(
			new THREE.TubeGeometry(curve, 1, 0.25,3),
			new THREE.MeshStandardMaterial({
				roughness: 0.9,
				metalness: 0.1,
				color: 0x60a030
			}));
		return p;
	}

})(window.THREE);