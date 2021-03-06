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
		drip = new Audio('assets/drip.ogg'),
		drop = new Audio('assets/drop.ogg'),
		particles = spawnParticles(new THREE.Color(1,0.8,0), new THREE.Vector3(0,0,100)),
		playerA = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(4,size,1),new THREE.Vector3(4,size-0.1,1)]),
			new THREE.Color(0.3,0.5,0),
			document.querySelector('#panel-a'),
			87, 83, drip),

		playerB = new Player(
			new THREE.CatmullRomCurve3([new THREE.Vector3(1,size,4),new THREE.Vector3(1,size-0.1,4)]),
			new THREE.Color(0,0.5,0.3),
			document.querySelector('#panel-b'),
			73, 75, drop),

		round = new Round(30, playerA, playerB);

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.position.set(-10,size+0.5,-10);
	camera.lookAt(new THREE.Vector3(3,3,3));
	scene.add(walls,wallBounds, playerB.mesh, playerA.mesh, particles);
	wallBounds.update();
	wallBounds.visible = false;
	makeLights();
	makeSky();
	animate();

	window.addEventListener('keydown', function(e){
		keys[e.keyCode] = true;
	});

	window.addEventListener('keyup', function(e){
		keys[e.keyCode] = false;
	});

	window.addEventListener('resize', windowResize, false);

	function animate(){
		window.requestAnimationFrame(animate);
		playerA.checkKeys();
		playerB.checkKeys();
		playerA.updateState();
		playerB.updateState();
		round.update();
		if(particles.visible){
			particles.rotation.y += 0.01;
			particles.scale.set(Math.sin(particles.rotation.y)+1,Math.sin(particles.rotation.y)+1,Math.sin(particles.rotation.y)+1);
		}
		renderer.render(scene, camera);
	}

	function MakeRoomBounds(size){
		var roomMat = new THREE.MeshStandardMaterial({
				side: THREE.BackSide,
				map: THREE.ImageUtils.loadTexture('assets/dirt.jpg'),
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
			spotB = new THREE.SpotLight(0xfffff0,0.8),
			pointA = new THREE.PointLight(0xfffff0, 0.5),
			spotLightHelperA = new THREE.SpotLightHelper( spotA ),
			spotLightHelperB = new THREE.SpotLightHelper( spotB );
		scene.add( spotA /*, spotLightHelperA*/);
		scene.add(spotB /*, spotLightHelperB*/ );
		scene.add(pointA);
		pointA.position.set(size/2,size/2,size);
		spotA.position.set(-15,-10,-15);
		spotB.position.set(-20,30,-20);
		spotA.target = spotB;
		spotLightHelperA.update();
		spotLightHelperB.update();
	}

	function makeSky(){
		var skyball = new THREE.Mesh(
			new THREE.PlaneGeometry(40,40,1,1),
			new THREE.MeshBasicMaterial({
				map: THREE.ImageUtils.loadTexture('assets/sky.jpg'),
			})
			);
		scene.add(skyball);
		skyball.position.set(10,size,10);
		skyball.rotation.y = -camera.rotation.y + Math.PI;
	}

	function windowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
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

	function Player(curve, color, domElement, keyGrow, keyShrink, sound){
		var p = {
			curve: curve,
			color: color,
			sound: sound,
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
				color: color.clone().addScalar(0.8),
				map: THREE.ImageUtils.loadTexture('assets/stipe.jpg'),
			})),

			cap: new THREE.Mesh(new THREE.LatheGeometry([
				new THREE.Vector3(0,0,0),
				new THREE.Vector3(1,0,0.1),
				new THREE.Vector3(0.75,0,0.5),
				new THREE.Vector3(0,0,0.75)
				]), new THREE.MeshStandardMaterial({
				roughness: 0.6,
				metalness: 0,
				color: color.add(new THREE.Color(1,0.2,0.3)),
				map: THREE.ImageUtils.loadTexture('assets/shroom.jpg'),
			})),

			tip: null,

			updateTube: function(){
				p.mesh.geometry.dispose();
				var tubeScale = Math.max(0.25 * (p.curve.points.length/p.max), 0.1);
				p.mesh.geometry = new THREE.TubeGeometry(p.curve, p.curve.points.length*3, tubeScale,6);
				p.count.textContent = p.curve.points.length;
				var scaleVal = 0.5 + 2*p.curve.points.length/p.max;
				p.stipe.scale.set(scaleVal,scaleVal,scaleVal);
				if(p.tip !== null){
					p.tip.position.copy(p.curve.points[p.curve.points.length-1]);
					p.tip.scale.set(tubeScale,tubeScale,tubeScale);
				}
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
					p.sound.play();
				}
				else if(keys[keyShrink] || p.shrinkTouch){
					p.state = -1;
					p.shrink.classList.add('active');
					p.sound.play();
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

		p.tip = new THREE.Mesh(new THREE.SphereGeometry(1,8,8), p.mesh.material);
		p.mesh.add(p.tip);
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
				particles.visible = false;
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
							r.domElement.textContent = 'Player 1 wins!';
							particles.visible=true;
							particles.material.color.copy(r.pA.color);
							particles.material.needsUpdate = true;
							particles.position.copy(r.pA.curve.points[0]);
						}
						else if(bScore > aScore){
							r.domElement.textContent = 'Player 2 wins!';
							particles.visible=true;
							particles.material.color.copy(r.pB.color);
							particles.material.needsUpdate = true;
							particles.position.copy(r.pB.curve.points[0]);
						}
						else {
							r.domElement.textContent = 'Tie';
							particles.visible = false;
						}
					}
				}
				else if(keys[32]){
					r.timer.elapsedTime = 0;
					r.start();
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

	function spawnParticles(color, pos){
		var pMat = new THREE.PointsMaterial({
				color: color,
				map: THREE.ImageUtils.loadTexture('assets/sparkles.png'),
				transparent:true
			}),
			pts = new THREE.Points(new THREE.Geometry(), pMat);
		for(var i=0; i<25; i++){
			pts.geometry.vertices.push(new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1));
		}
		pts.geometry.verticesNeedUpdate = true;
		pts.position.copy(pos);
		pts.visible = false;
		return pts;
	}

})(window.THREE);