/*
 @author hermanncain
 basic class of unit visual guide: rib
 object
    - end container
        - end mesh
    - p2 container
        - p1 mesh
    - p2 container
        - p2 mesh
    - curve container
        - curve mesh
 */
function Rib (end) {

    THREE.Object3D.call(this);

    this.type = 'Rib';
    this.skeleton =false;

    // container for rotation
    this.endContainer = new THREE.Group();
    this.point1Container = new THREE.Group();
    this.point2Container = new THREE.Group();
    this.curveContainer = new THREE.Group();
    this.markContainer = new THREE.Group();
    this.add(this.endContainer,this.point1Container,this.point2Container,this.curveContainer,this.markContainer);

    // data
    if(end) this.setEnd(end);
    this.start = new THREE.Vector3();
    this.endPosition = null;
    this.p1 = null;
    this.p2 = null;
    this.curve = null;
    this.marks = [];

    this.translated = false;

    this.curveMaterial = new THREE.LineBasicMaterial({color:0x0000ff});

}

Rib.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: Rib,

    clone: function () {

        // clone end first
        // material must be cloned, otherwise it will be shared
        let cloneEnd = this.end.clone();
        cloneEnd.material = this.end.material.clone();

        // build rib clone
        let rib = new Rib(cloneEnd);
        rib.curveMaterial = this.curveMaterial.clone();
        rib.initialize();
        rib.p1.applyMatrix(this.p1.matrix);
        rib.p2.applyMatrix(this.p2.matrix);
        rib.endContainer.applyMatrix(this.endContainer.matrix);
        rib.point1Container.applyMatrix(this.point1Container.matrix);
        rib.point2Container.applyMatrix(this.point2Container.matrix);
        rib.curveContainer.applyMatrix(this.curveContainer.matrix);
        rib.applyMatrix(this.matrix);
        rib.buildCurve();
        return rib;
    },

    dispose: function () {
        this.traverse(function(obj){
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                obj.material.dispose();
            }
        });
    },

    setEnd: function (end) {
        this.end = end;
        this.endContainer.add(this.end);
    },

    // initialize p1,p2 and build a straight line
    initialize: function() {
        this.point1Container.children = [];
        this.point2Container.children = [];
        let endPosition = this.end.position.clone().applyMatrix4(this.endContainer.matrix);
        // create point meshes
        let pointGeometry = new THREE.BufferGeometry();
        pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
        this.p1 = new THREE.Points(pointGeometry, this.end.material.clone());
        this.p1.name='ribpoint';
        this.p1.layers.set(1);
        this.p2 = this.p1.clone();
        this.p2.material = this.p1.material.clone();
        
        this.p1.position.copy(endPosition.clone().multiplyScalar(1/3));
        this.p2.position.copy(endPosition.clone().multiplyScalar(2/3));
        this.point1Container.add(this.p1);
        this.point2Container.add(this.p2);
        
        this.buildCurve();
    },

    // call when end, p1 or p2 changes
    buildCurve: function () {
        // clear previous curve
        this.curveContainer.children = [];
        // update points
        let endPosition = this.end.position.clone().applyMatrix4(this.endContainer.matrix);
        let pos1 = this.p1.position.clone().applyMatrix4(this.point1Container.matrix);
        let pos2 = this.p2.position.clone().applyMatrix4(this.point2Container.matrix);
        // rebuild curve
        this.curve = new THREE.CatmullRomCurve3([this.start,pos1,pos2,endPosition]);
        let pts = this.curve.getPoints(200);
        // let geo = new THREE.Geometry();
        // geo.vertices.push(...pts);
        // let mesh = new THREE.Line(geo, this.curveMaterial);
        // mesh.name = 'ribcurve';
        // mesh.layers.set(3);
        // this.curveContainer.add(mesh);
        this.buildGeometry(pts)
        if (!this.translated) {
            this.endPosition = this.end.position.clone().applyMatrix4(this.endContainer.matrix);
            this.p1Position = this.p1.position.clone().applyMatrix4(this.point1Container.matrix);
            this.p2Position = this.p2.position.clone().applyMatrix4(this.point2Container.matrix);
        }
    },

    buildGeometry: function (pts) {
        var geometry = null;
        var mesh = null;
        if (this.skeleton) {
            this.setPointSize(0.2);
            geometry = new THREE.TubeBufferGeometry(this.curve,200,0.05,4);
            mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x00ffff}));
            mesh.layers.set(3);
            mesh.name = 'ribcurve';
            this.curveContainer.add(mesh);
        } else {
            geometry = new THREE.Geometry();
            geometry.vertices.push(...pts);
            mesh = new THREE.Line(geometry, this.curveMaterial);
            mesh.name = 'ribcurve';
            mesh.layers.set(3);
            this.curveContainer.add(mesh);
        }
    },

    select: function () {
        this.setColor(0xffaa00);
    },

    deselect: function () {
        this.setColor(0x0000ff);
    },

    setColor: function (hex) {
        this.end.material.color.setHex(hex);
        this.p1.material.color.setHex(hex);
        this.p2.material.color.setHex(hex);
        this.curveContainer.children[0].material.color.setHex(hex);
    },

    setPointSize: function (s) {
        this.end.material.size = s;
        this.p1.material.size = s;
        this.p2.material.size = s;
    },

    // get positions
    getEndPosition: function () {
        let pos = this.end.position.clone();
        pos.applyMatrix4(this.endContainer.matrix);
        pos.applyMatrix4(this.matrix);
        return pos;
    },

    // servo cylindrical coordinates
    getServoCylindrical: function(obj) {
        let t0 = Math.atan2( this.end.position.x, this.end.position.y );
        let r = Math.sqrt( obj.position.x ** 2 + obj.position.y ** 2 );
        let t = obj.name == 'vp'? t0 : Math.atan2( obj.position.x, obj.position.y )-t0;
        let h = obj.position.z;
        return {r:r,t:t,h:h};
    },
    setServoCylindrical: function (obj,c) {
        let t = obj.name == 'vp'? c.t : c.t + Math.atan2( this.end.position.x, this.end.position.y );
        let x = c.r * Math.sin( t );
        let z = c.h;
        let y = c.r * Math.cos( t );
        obj.position.set(x,y,z);
        if (this.curve) {
            this.buildCurve();
        }
    },

    // Coordiante transformations

    // transformations between the Unit Coordiante System (UCS) and 
    // the Rib Coordinate System (RCS)
    // UCS -> RCS
    unitToRib: function (vUCS) {
        let theta = Math.atan2(this.end.position.y,this.end.position.x);
        let euler = new THREE.Euler(0,0,-theta);
        let vRCS = vUCS.clone().applyEuler(euler);
        return vRCS;
    },
    // RCS -> UCS
    ribToUnit: function (vRCS) {
        let theta = Math.atan2(this.end.position.y,this.end.position.x);
        let euler = new THREE.Euler(0,0,theta);
        let vUCS = vRCS.clone().applyEuler(euler);
        return vUCS;
    },
    allPointsToRib: function () {
        let p1 = this.unitToRib(this.p1.position);
        let p2 = this.unitToRib(this.p2.position);
        let p3 = this.unitToRib(this.end.position);
        return [p1,p2,p3];
    },
    updatePointFromRib: function (vUCS,vRCS) {
        vUCS.copy(this.ribToUnit(vRCS));
        if (this.curve) {
            this.buildCurve();
        }
    },
    updatePointsFromRib: function (vRCS1,vRCS2) {
        this.p1.position.copy(this.ribToUnit(vRCS1));
        this.p2.position.copy(this.ribToUnit(vRCS2));
        if (this.curve) {
            this.buildCurve();
        }
    },


    // Shape semantics
    // comprise 3 mean-deviation pairs

    // Radical bias \mu_r
    getBias: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        return (p1.x+p2.x)/p3.x-1;
    },
    setBias: function (b) {
        let [p1,p2,p3] = this.allPointsToRib();
        let sep = p2.x-p1.x;
        p1.x = p3.x/2 - sep/2 + b/2*p3.x;
        p2.x = p3.x/2 + sep/2 + b/2*p3.x;
        this.updatePointsFromRib(p1,p2);
    },

    // Radical separation \sigma_r
    getSep: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        return (p2.x-p1.x)/p3.x;
    },
    setSep: function(s) {
        let [p1,p2,p3] = this.allPointsToRib();
        let center = (p1.x+p2.x)/2;
        p1.x = center - s*p3.x/2;
        p2.x = center + s*p3.x/2;
        this.updatePointsFromRib(p1,p2);
    },

    // Tangent bending \mu_t
    getTangentArch: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        return -(p1.y+p2.y)/p3.x;
    },
    setTangentArch: function (a) {
        let [p1,p2,p3] = this.allPointsToRib();
        let d = -a*p3.x/2;
        let sep = (p2.y-p1.y)/2;
        p1.y = d + sep;
        p2.y = d - sep;
        this.updatePointsFromRib(p1,p2);
    },

    // Tangent waveness \sigma_t
    getTangentWave: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        return (p2.y-p1.y)/p3.x;
    },
    setTangentWave: function (a) {
        let [p1,p2,p3] = this.allPointsToRib();
        let center = (p1.y+p2.y)/2;
        let d = a*p3.x/2;
        p1.y = center - d;
        p2.y = center + d;
        this.updatePointsFromRib(p1,p2);
    },

    // Axial bending \mu_a
    getAxialArch: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        let theta = Math.atan2(p3.z,p3.x);
        return (p1.z+p2.z-p3.z/p3.x*(p1.x+p2.x))*Math.cos(theta)**2/p3.x;
    },
    setAxialArch: function (a) {
        let [p1,p2,p3] = this.allPointsToRib();
        let theta = Math.atan2(p3.z,p3.x);
        this.p1.position.z = a*p3.x/Math.cos(theta)**2/2+p1.x/p3.x*p3.z;
        this.p2.position.z = a*p3.x/Math.cos(theta)**2/2+p2.x/p3.x*p3.z;
        if (this.curve) {
            this.buildCurve();
        }
    },

    // Axial waveness \sigma_a
    getAxialWave: function () {
        let [p1,p2,p3] = this.allPointsToRib();
        let theta = Math.atan2(p3.z,p3.x);
        return (p1.z-p2.z+p3.z/p3.x*(p2.x-p1.x))*Math.cos(theta)**2/p3.x;
    },
    setAxialWave: function (a) {
        let [p1,p2,p3] = this.allPointsToRib();
        let theta = Math.atan2(p3.z,p3.x);
        let deltaZ = a*p3.x/Math.cos(theta)**2/2;
        let sepZ = (p2.x-p1.x)/2*Math.tan(theta);
        let centerZ = (p1.z+p2.z)/2;
        this.p1.position.z = centerZ - sepZ + deltaZ;
        this.p2.position.z = centerZ + sepZ - deltaZ;
        if (this.curve) {
            this.buildCurve();
        }
    },


    // Morphing operations
    setMorphScale: function (sx,sy,sz) {
        this.endContainer.scale.set(sx,sy,sz);
        this.end.scale.set(1/sx,1/sy,1/sz);
        this.point1Container.scale.set(sx,sy,sz);
        this.p1.scale.set(1/sx,1/sy,1/sz);
        this.point2Container.scale.set(sx,sy,sz);
        this.p2.scale.set(1/sx,1/sy,1/sz);
        this.endContainer.updateMatrix();
        this.point1Container.updateMatrix();
        this.point2Container.updateMatrix();
    },
    resetMorphScale: function () {
        this.endContainer.scale.set(1,1,1);
        this.end.scale.set(1,1,1);
        this.point1Container.scale.set(1,1,1);
        this.p1.scale.set(1,1,1);
        this.point2Container.scale.set(1,1,1);
        this.p2.scale.set(1,1,1);
        this.endContainer.updateMatrix();
        this.point1Container.updateMatrix();
        this.point2Container.updateMatrix();
    },
    resetMorphTranslation: function () {
        this.end.position.copy(this.endPosition);
        this.p1.position.copy(this.p1Position);
        this.p2.position.copy(this.p2Position);
    },
    setMorphTranslation: function (bx,by,bz) {
        // reset positions
        this.resetMorphTranslation();
        // translate based on distance ratio
        let v0 = rib.end.position.distanceTo(new THREE.Vector3());
        let v1 = rib.p1.position.distanceTo(new THREE.Vector3())/v0;
        let v2 = rib.p2.position.distanceTo(new THREE.Vector3())/v0;
        this.end.position.x += bx;
        this.end.position.y += by;
        this.end.position.z += bz;
        this.p1.position.x += bx*v1;
        this.p1.position.y += by*v1;
        this.p1.position.z += bz*v1;
        this.p2.position.x += bx*v2;
        this.p2.position.y += by*v2;
        this.p2.position.z += bz*v2;
        this.end.updateMatrix();
        this.p1.updateMatrix();
        this.p2.updateMatrix();
        this.translated = true;
    },


    // Accessory landmark operations
    // TODO
    getTNB: function(t) {
        let tangent = this.curve.getTangent(t);
        return tangent.applyMatrix4(this.endContainer.matrix).applyMatrix4(this.matrix);
    },

    addMark: function (t) {
        this.marks.push(t);
    },

    clearMark: function () {
        this.marks = [];
    },

    removeMark: function (t) {
        this.marks.splice(this.marks.indexOf(t),1);
    },

    showMarks: function () {
        this.markContainer.children = [];
        for (p of this.marks) {
            let pos = this.curve.getPointAt(p);
            let mesh = new THREE.Mesh(new THREE.OctahedronBufferGeometry*0.2,new THREE.MeshBasicMaterial({color: 0x00ffff}));
            mesh.position.copy(pos);
            this.markContainer.add(mesh)
        }
    },


    toJSON: function () {
        return {
            end:this.end.position.toArray(),
            p1:this.p1.position.toArray(),
            p2:this.p2.position.toArray(),
            matrix:this.matrix.toArray(),
            endContainerMatrix:this.endContainer.matrix.toArray(),
            p1ContainerMatrix:this.point1Container.matrix.toArray(),
            p2ContainerMatrix:this.point2Container.matrix.toArray(),
            curveContainerMatrix:this.curveContainer.matrix.toArray(),
        }
    },

    fromJSON: function (data) {

        let pointGeometry = new THREE.BufferGeometry();
        pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
        let end = new THREE.Points(pointGeometry,new THREE.PointsMaterial( { color: 0x0000ff } ));
        end.name = 'ribpoint';
        end.layers.set(1);
        end.position.copy(new THREE.Vector3().fromArray(data.end));
        
        this.setEnd(end);
        this.initialize();

        this.p1.position.copy(new THREE.Vector3().fromArray(data.p1));
        this.p2.position.copy(new THREE.Vector3().fromArray(data.p2));
        this.endContainer.applyMatrix(new THREE.Matrix4().fromArray(data.endContainerMatrix));
        this.point1Container.applyMatrix(new THREE.Matrix4().fromArray(data.p1ContainerMatrix));
        this.point2Container.applyMatrix(new THREE.Matrix4().fromArray(data.p2ContainerMatrix));
        this.curveContainer.applyMatrix(new THREE.Matrix4().fromArray(data.curveContainerMatrix));
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.buildCurve();
    },
});