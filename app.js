(function(THREE){
	'use strict';

	var renderer = new THREE.WebGLRenderer({
			antialias: true
		}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000),
		spot = new THREE.SpotLight(0xfffff0, 2.5),
		size = 7,
		defaultGeo = new THREE.CylinderGeometry(0.125,0.18,0.5),
		defaultSphere = new THREE.SphereGeometry(0.18,10,10),
		cubes = new MakeCubes(size),
		walls = new MakeRoomBounds(size),
		axisHelper = new THREE.AxisHelper(5); //x is red
	document.body.appendChild(renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	axisHelper.position.set(-size/2 - 0.5,-size/2 - 0.5,-size/2 - 0.5);
	camera.position.set(-10.5,2,-10.5);
	camera.lookAt(new THREE.Vector3(0,0,0));
	spot.position.set(-8,size,-8);
	scene.add(cubes,axisHelper,spot,walls);
	var playerA = setVoxel(size-1,0,0,true);
	var playerB = setVoxel(0,0,size-1,true);

	setColor(playerA, new THREE.Color(0.6,0.8,0.1));
	setColor(playerB, new THREE.Color(0.1,0.8,0.6));
	animate();

	window.setInterval(function(){
		var aNeighbors = getNeighbors(playerA);
		var bNeighbors = getNeighbors(playerB);

		var randIndexA = Math.round(Math.random()*(aNeighbors.length-1));
		if(randIndexA === -0) randIndexA = 0;
		if(aNeighbors[randIndexA] === undefined){
			console.log(randIndexA + '/' + aNeighbors.length);
		}
		else if(!aNeighbors[randIndexA].visible){
			aNeighbors[randIndexA].visible = true;
			setColor(aNeighbors[randIndexA], playerA.material.color);
			updateArms(playerA, aNeighbors);
			playerA = aNeighbors[randIndexA];
			updateArms(playerA, getNeighbors(playerA));
		}

		var randIndexB = Math.round(Math.random()*(bNeighbors.length-1));
		if(randIndexB === -0) randIndexB = 0;
		if(bNeighbors[randIndexB] === undefined){
			console.log(randIndexB + '/' + bNeighbors.length);
		}
		else if(!bNeighbors[randIndexB].visible){
			bNeighbors[randIndexB].visible = true;
			setColor(bNeighbors[randIndexB], playerB.material.color);
			updateArms(playerB, bNeighbors);
			playerB = bNeighbors[randIndexB];
			updateArms(playerB, getNeighbors(playerB));
		}

	}, 100);

	function animate(){
		window.requestAnimationFrame(animate);
		renderer.render(scene, camera);
	}

	function reduce(arr){
		var arrOk = [];
		arr.forEach(function(an){
			if(an !== undefined && !an.visible){
				arrOk.push(an);
			}
		});
		return arrOk;
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
		if(voxel){
			voxel.visible = d;
			return voxel;
		}
		return undefined;
	}

	function MakeCubes(size){
		var cubeParent = new THREE.Object3D();
		
		for(var i=0; i<size; i++){
			for(var j=0; j<size; j++){
				for(var k=0; k<size; k++){
					var voxel = new Voxel(i - size/2,j - size/2,k - size/2);
					voxel.name = i + '.' + j + '.' + k;
					voxel.visible = false;
					cubeParent.add(voxel);
				}
			}
		}
		return cubeParent;
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
		return roomMesh;
	}

})(window.THREE);