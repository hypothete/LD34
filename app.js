(function(THREE){
	'use strict';

	var renderer = new THREE.WebGLRenderer({
			antialias: true
		}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000),
		size = 5,
		keys = {},
		walls = new MakeRoomBounds(size),
		wallBounds= new THREE.BoundingBoxHelper(walls, 0xff00ff),

		playerA = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(4,size,1),new THREE.Vector3(4,size-0.1,1)]),
			new THREE.Color(0.3,0.5,0),
			document.querySelector('#panel-a'),
			87, 83),

		playerB = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(1,size,4),new THREE.Vector3(1,size-0.1,4)]),
			new THREE.Color(0,0.5,0.3),
			document.querySelector('#panel-b'),
			73, 75),

		round = new Round(30, playerA, playerB);

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.position.set(-10,size,-10);
	camera.lookAt(new THREE.Vector3(3,3,3));
	scene.add(walls,wallBounds, playerB.mesh, playerA.mesh);
	wallBounds.update();
	wallBounds.visible = false;
	makeLights();
	animate();

	window.addEventListener('keydown', function(e){
		keys[e.keyCode] = true;
		if(keys[32] && !round.timer.running){
			round.start();
		}
	});

	window.addEventListener('keyup', function(e){
		keys[e.keyCode] = false;
	});

	function animate(){
		window.requestAnimationFrame(animate);
		playerA.checkKeys();
		playerB.checkKeys();
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

	function makeLights(){
		var spotA = new THREE.SpotLight(0x668880, 1),
			spotB = new THREE.SpotLight(0xfffff0,1),
			spotLightHelperA = new THREE.SpotLightHelper( spotA ),
			spotLightHelperB = new THREE.SpotLightHelper( spotB );
		scene.add( spotA /*, spotLightHelperA*/);
		scene.add(spotB /*, spotLightHelperB*/ );

		spotA.position.set(-15,-20,-15);
		spotB.position.set(-10,50,-10);
		spotA.target = spotB;
		spotLightHelperA.update();
		spotLightHelperB.update();
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

	function Player(curve, color, domElement, keyGrow, keyShrink){
		var p = {
			curve: curve,
			color: color,
			grow: domElement.querySelector('.grow'),
			keyGrow: keyGrow,
			keyShrink: keyShrink,
			growTouch: false,
			shrinkTouch: false,
			state: 0, //0 = nothing, 1 = growing, -1 = shrinking
			shrink: domElement.querySelector('.shrink'),
			domElement: domElement,
			count: domElement.querySelector('h1'),
			max: size*size*size,
			inRound: false,

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

			updateTube: function(){
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
						p.updateTube();
					}
				}
				else if(p.state == -1){
					if(p.curve.points.length > 2){
						p.curve.points.length --;
						p.updateTube();
					}
				}
			},
			checkKeys: function(){
				p.grow.classList.remove('active');
				p.shrink.classList.remove('active');
				if(keys[keyGrow] || p.growTouch){
					p.state = 1;
					p.grow.classList.add('active');
				}
				else if(keys[keyShrink] || p.shrinkTouch){
					p.state = -1;
					p.shrink.classList.add('active');
				}
				else {
					p.state = 0;
				}
			}
		};

		p.stipe.position.copy(p.curve.points[0]);
		p.cap.position.set(0,0,1.5);
		p.stipe.add(p.cap);
		p.stipe.rotation.x = -Math.PI/2;
		p.mesh.add(p.stipe);

		p.grow.addEventListener('touchstart', function (e){
			if (e) e.preventDefault();
			p.growTouch = true;
		});
		p.grow.addEventListener('touchend', function (e){
			if (e) e.preventDefault();
			p.growTouch = false;
		});
		p.grow.addEventListener('mousedown', function (e){
			if (e) e.preventDefault();
			p.growTouch = true;
		});
		p.grow.addEventListener('mouseup', function (e){
			if (e) e.preventDefault();
			p.growTouch = false;
		});

		p.shrink.addEventListener('touchstart', function (e){
			if (e) e.preventDefault();
			p.shrinkTouch = true;
		});
		p.shrink.addEventListener('touchend', function (e){
			if (e) e.preventDefault();
			p.shrinkTouch = false;
		});
		p.shrink.addEventListener('mousedown', function (e){
			if (e) e.preventDefault();
			p.shrinkTouch = true;
		});
		p.shrink.addEventListener('mouseup', function (e){
			if (e) e.preventDefault();
			p.shrinkTouch = false;
		});

		p.updateTube();

		return p;
	}

	function Round(duration, pA, pB){
		var r = {
			timer: new THREE.Clock(false),
			duration: duration,
			pA: pA,
			pB: pB,
			domElement: document.querySelector('#timeleft'),
			start: function(){
				r.timer.start();
				r.pA.curve.points.length = r.pB.curve.points.length = 2;
				r.pA.inRound = r.pB.inRound = true;
				r.pA.updateTube();
				r.pB.updateTube();
			},
			update: function(){
				if(r.timer.running){
					var elapsed = r.timer.getElapsedTime();
					r.domElement.textContent = Math.round(r.duration - elapsed);
					if(elapsed >= r.duration){
						r.timer.stop();
						var aScore = r.pA.curve.points.length,
							bScore = r.pB.curve.points.length;

						r.pA.inRound = r.pB.inRound = false;

						if(aScore > bScore){
							r.domElement.textContent = 'Player A wins';
						}
						else if(bScore > aScore){
							r.domElement.textContent = 'Player B wins';
						}
						else {
							r.domElement.textContent = 'Tie';
						}
					}
				}
			}
		};

		r.domElement.addEventListener('click', function(e){
			e.preventDefault();
			requestFullscreen(document.body);
			var elapsed = r.timer.getElapsedTime();
			if(!r.timer.running && elapsed < 1){ //not started yet
				r.start();
			}
			else if(!r.timer.running && elapsed >= r.duration){ //round ended
				r.timer.elapsedTime = 0;
				r.start();
			}
		});
		return r;
	}

	function requestFullscreen(elem){
		if(elem.requestFullscreen){
			elem.requestFullscreen();
		}
		else if(elem.webkitRequestFullscreen){
			elem.webkitRequestFullscreen();
		}
		else if(elem.mozRequestFullscreen){
			elem.mozRequestFullscreen();
		}
	}

})(window.THREE);