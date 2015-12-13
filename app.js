(function(THREE){
	'use strict';

	var renderer = new THREE.WebGLRenderer({
			antialias: true
		}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000),
		spot = new THREE.SpotLight(0xfffff0, 1),
		size = 5,
		walls = new MakeRoomBounds(size),
		wallBounds= new THREE.BoundingBoxHelper(walls, 0xff00ff),
		playerA = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(4,size,1),new THREE.Vector3(4,size-0.1,1)]),
			new THREE.Color(0.3,0.5,0),
			document.querySelector('#panel-a')),
		playerB = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(1,size,4),new THREE.Vector3(1,size-0.1,4)]),
			new THREE.Color(0,0.5,0.3),
			document.querySelector('#panel-b')),
		round = new Round(60);

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.position.set(-10,size,-10);
	camera.lookAt(new THREE.Vector3(3,3,3));
	spot.position.set(-9,9,-9);

	scene.add(spot,walls,wallBounds, playerB.mesh, playerA.mesh);
	wallBounds.update();
	wallBounds.visible = false;
	round.start();
	animate();

	function animate(){
		window.requestAnimationFrame(animate);
		playerA.updateState();
		playerB.updateState();
		round.update();
		renderer.render(scene, camera);
	}

	function MakeRoomBounds(size){
		var roomMat = new THREE.MeshStandardMaterial({
				side: THREE.BackSide,
				color: 0x442211,
				roughness: 0.9,
				metalness: 0
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
			color: color,
			grow: domElement.querySelector('.grow'),
			state: 0, //0 = nothing, 1 = growing, -1 = shrinking
			shrink: domElement.querySelector('.shrink'),
			domElement: domElement,
			count: domElement.querySelector('h1'),
			max: size*size*size,
			mesh: new THREE.Mesh(
			new THREE.TubeGeometry(curve, 1, 0.25,3),
			new THREE.MeshStandardMaterial({
				roughness: 0.7,
				metalness: 0,
				color: color.clone().addScalar(0.8) || 0x60a030
			})),
			stipe: new THREE.Mesh(new THREE.LatheGeometry([
				new THREE.Vector3(0.1,0,0),
				new THREE.Vector3(0.25,0,0.5),
				new THREE.Vector3(0.1,0,1.5)
				]), new THREE.MeshStandardMaterial({
				roughness: 0.7,
				metalness: 0,
				color: color.clone().addScalar(0.8)
			})),
			cap: new THREE.Mesh(new THREE.LatheGeometry([
				new THREE.Vector3(0,0,0),
				new THREE.Vector3(1,0,0.1),
				new THREE.Vector3(0.75,0,0.5),
				new THREE.Vector3(0,0,0.75)
				]), new THREE.MeshStandardMaterial({
				roughness: 0.6,
				metalness: 0.3,
				color: color.add(new THREE.Color(1,0.2,0.3))
			})),

			update: function(){
				p.mesh.geometry.dispose();
				p.mesh.geometry = new THREE.TubeGeometry(p.curve, p.curve.points.length*3, Math.max(0.25 * (p.curve.points.length/p.max), 0.1),6);
				p.count.textContent = p.curve.points.length;
				var scaleVal = 0.5 + 2*p.curve.points.length/p.max;
				p.stipe.scale.set(scaleVal,scaleVal,scaleVal);
			},
			updateState: function(){
				if(p.state == 1 && p.curve.points.length < p.max){
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

		p.stipe.position.copy(p.curve.points[0]);
		p.cap.position.set(0,0,1.5);
		p.stipe.add(p.cap);
		p.stipe.rotation.x = -Math.PI/2;
		p.mesh.add(p.stipe);

		p.count.style.color = p.mesh.material.color.getStyle();

		function growHandler(e){
			e.preventDefault();
			p.state = 1;
		}

		function shrinkHandler(e){
			e.preventDefault();
			p.state = -1;
		}

		function inactiveHandler(e){
			e.preventDefault();
			p.state = 0;
		}

		p.grow.addEventListener('touchstart', growHandler);
		p.shrink.addEventListener('touchstart', shrinkHandler);
		p.grow.addEventListener('touchend', inactiveHandler);
		p.shrink.addEventListener('touchend', inactiveHandler);
		p.grow.addEventListener('mousedown', growHandler);
		p.shrink.addEventListener('mousedown', shrinkHandler);
		p.grow.addEventListener('mouseup', inactiveHandler);
		p.shrink.addEventListener('mouseup', inactiveHandler);

		p.update();

		return p;
	}

	function Round(duration){
		var r = {
			timer: new THREE.Clock(),
			duration: duration,
			start: function(){
				r.timer.start();
				playerA.curve.points.length = 2;
				playerB.curve.points.length = 2;
			},
			update: function(){
				if(r.timer.running){
					var elapsed = r.timer.getElapsedTime();
					if(elapsed >= r.duration){
						r.timer.stop();
						var aScore = playerA.curve.points.length,
							bScore = playerB.curve.points.length;
						if(aScore > bScore){
							console.log('Player A wins');
						}
						else if(bScore > aScore){
							console.log('Player B wins');
						}
						else {
							console.log('tie');
						}
					}
				}
			}
		};
		return r;
	}

})(window.THREE);