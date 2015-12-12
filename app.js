(function(THREE){
	'use strict';

	var renderer = new THREE.WebGLRenderer({
			antialias: true
		}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000),
		spot = new THREE.SpotLight(0xfffff0, 1),
		size = 7,
		defaultGeo = new THREE.CylinderGeometry(0.125,0.18,0.5),
		defaultSphere = new THREE.SphereGeometry(0.18,10,10),
		walls = new MakeRoomBounds(size),
		wallBounds= new THREE.BoundingBoxHelper(walls, 0xff00ff),
		playerA = setVoxel(3,0,3,true);

	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	camera.position.set(-9,5,-9);
	camera.lookAt(new THREE.Vector3(3,3,3));
	spot.position.set(-15,8,-15);
	spot.castShadow = true;
	spot.shadowMapWidth = 512;
	spot.shadowMapHeight = 512;
	spot.shadowCameraNear = 1;
	spot.shadowCameraFar = 500;
	spot.shadowCameraFov = 30;

	scene.add(spot,walls);
	scene.add(wallBounds);
	wallBounds.update();
	wallBounds.visible = false;
	setColor(playerA, new THREE.Color(0.6,0.8,0.1));
	animate();

	window.setInterval(function(){
		var aNeighbors = getNeighbors(playerA);
		var randIndexA = Math.round(Math.random()*(aNeighbors.length-1));
		if(randIndexA === -0) randIndexA = 0;
		var randNbr = aNeighbors[randIndexA];
		var mod = getIndexModifier(randIndexA);
		var nextPosition = new THREE.Vector3(
			playerA.position.x+mod[0],
			playerA.position.y+mod[1],
			playerA.position.z+mod[2]);
		if(randNbr === undefined && randIndexA !== 3 && wallBounds.box.containsPoint(nextPosition)){ //no negative y
			randNbr = setVoxel(nextPosition.x, nextPosition.y, nextPosition.z,true);
			setColor(randNbr, playerA.material.color);
			aNeighbors[randIndexA] = randNbr;
			updateArms(playerA, aNeighbors);
			playerA = randNbr;
			updateArms(playerA, getNeighbors(playerA));
			spot.target = playerA;
		}
	}, 60);

	function animate(){
		window.requestAnimationFrame(animate);
		renderer.render(scene, camera);
	}

	function getVoxel(a,b,c){
		return scene.getObjectByName(a+'.'+b+'.'+c);
	}

	function setColor(voxel, color){
		voxel.material.color = color;
		voxel.material.needsUpdate = true;
	}

	function updateArms(voxel, neighbors){
		var arms = [
			voxel.getObjectByName('px'),
			voxel.getObjectByName('nx'),
			voxel.getObjectByName('py'),
			voxel.getObjectByName('ny'),
			voxel.getObjectByName('pz'),
			voxel.getObjectByName('nz'),
		];
		arms.forEach(function(arm, index){
			arm.visible = !!neighbors[index] && neighbors[index].visible;
		});
	}

	function getIndexModifier(n){
		var modifiers = [
			[1,0,0],
			[-1,0,0],
			[0,1,0],
			[0,-1,0],
			[0,0,1],
			[0,0,-1]
		];
		return modifiers[n];
	}

	function getNeighbors(voxel){
		var voxelVals = voxel.name.split('.'),
			a = Number(voxelVals[0]),
			b = Number(voxelVals[1]),
			c = Number(voxelVals[2]),
			neighbors = [
			getVoxel(a+1,b,c), //px
			getVoxel(a-1,b,c), //nx
			getVoxel(a,b+1,c), //py
			getVoxel(a,b-1,c), //ny
			getVoxel(a,b,c+1), //pz
			getVoxel(a,b,c-1)  //nz
		];
		return neighbors;
	}

	function setVoxel(a,b,c,d){
		var voxel = getVoxel(a,b,c);
		if(!voxel){
			voxel = new Voxel(a,b,c);
			voxel.name = a + '.' + b + '.' + c;
			scene.add(voxel);
		}
		voxel.visible = d;
		return voxel;
	}

	function Voxel(a,b,c){
		var v = new THREE.Mesh(defaultSphere,
			new THREE.MeshStandardMaterial({
				roughness: 0.9,
				metalness: 0.2,
				color: 0x60a030
			})),
			px = new THREE.Mesh(defaultGeo, v.material),
			nx = new THREE.Mesh(defaultGeo, v.material),
			py = new THREE.Mesh(defaultGeo, v.material),
			ny = new THREE.Mesh(defaultGeo, v.material),
			pz = new THREE.Mesh(defaultGeo, v.material),
			nz = new THREE.Mesh(defaultGeo, v.material);
		px.name='px';
		nx.name='nx';
		py.name='py';
		ny.name='ny';
		pz.name='pz';
		nz.name='nz';
		px.position.set(0.25,0,0);
		px.rotation.set(0,0,-Math.PI/2);
		nx.position.set(-0.25,0,0);
		nx.rotation.set(0,0,Math.PI/2);
		py.position.set(0,0.25,0);
		ny.position.set(0,-0.25,0);
		ny.rotation.set(-Math.PI,0,0);
		pz.position.set(0,0,0.25);
		pz.rotation.set(Math.PI/2,0,0);
		nz.position.set(0,0,-0.25);
		nz.rotation.set(-Math.PI/2,0,0);
		v.add(px,nx,py,ny,pz,nz);
		v.position.set(a,b,c);
		v.castShadow = true;
		v.receiveShadow = true;
		v.children.forEach(function(c){
			c.castShadow = true;
			c.receiveShadow = true;
		});
		return v;
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
			roomMesh.receiveShadow = true;
		return roomMesh;
	}

})(window.THREE);