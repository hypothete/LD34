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
		playerA = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(5,0,1),new THREE.Vector3(5,1,1)]),
			new THREE.Color(1,0,0.1),
			document.querySelector('#panel-a')),
		playerB = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(1,0,5),new THREE.Vector3(1,1,5)]),
			new THREE.Color(0,0.5,1),
			document.querySelector('#panel-b'));

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.position.set(-9,5,-9);
	camera.lookAt(new THREE.Vector3(3,3,3));
	spot.position.set(-15,8,-15);

	scene.add(spot,walls,wallBounds, playerB.mesh, playerA.mesh);
	wallBounds.update();
	wallBounds.visible = false;
	animate();

	function animate(){
		window.requestAnimationFrame(animate);
		playerA.updateState();
		playerB.updateState();
		renderer.render(scene, camera);
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

	function isPointInCurve(point, pts){
		var rtnVal = point;
		pts.forEach(function(pt){
			if(pt.equals(point)){
				rtnVal = true;
			}
		});
		return rtnVal;
	}

	function getCurveNeighbors(last){
		var pointsList = [].concat(playerA.curve.points, playerB.curve.points),
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

	function Player(curve, color, domElement){
		var p = {
			curve: curve,
			grow: domElement.querySelector('.grow'),
			state: 0, //0 = nothing, 1 = growing, -1 = shrinking
			shrink: domElement.querySelector('.shrink'),
			domElement: domElement,
			count: domElement.querySelector('h1'),
			mesh: new THREE.Mesh(
			new THREE.TubeGeometry(curve, 1, 0.25,3),
			new THREE.MeshStandardMaterial({
				roughness: 0.9,
				metalness: 0.1,
				color: color || 0x60a030
			})),
			update: function(){
				p.mesh.geometry.dispose();
				p.mesh.geometry = new THREE.TubeGeometry(p.curve, p.curve.points.length*3, 0.25,6);
				p.count.textContent = p.curve.points.length;
			},
			updateState: function(){
				if(p.state == 1){
					var last = p.curve.points[p.curve.points.length-1],
						neighbors = getCurveNeighbors(last),
						randIndexB = Math.round(Math.random()*(neighbors.length-1)),
						randNbr = neighbors[randIndexB];
					if(randNbr !== true && wallBounds.box.containsPoint(randNbr)){
						p.curve.points.push(randNbr);
						p.update();
					}
				}
				else if(p.state == -1){
					if(p.curve.points.length > 2){
						p.curve.points.length --;
						p.update();
					}
				}
			}
		};

		p.count.style.color = p.mesh.material.color.getStyle();

		p.grow.addEventListener('touchstart', function(e){
			e.preventDefault();
			p.state = 1;
		});

		p.shrink.addEventListener('touchstart', function(e){
			e.preventDefault();
			p.state = -1;
		});

		p.grow.addEventListener('touchend', function(e){
			e.preventDefault();
			p.state = 0;
		});

		p.shrink.addEventListener('touchend', function(e){
			e.preventDefault();
			p.state = 0;
		});

		return p;
	}

})(window.THREE);