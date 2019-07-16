/**
 * @class Sketch
 * @params {string} name
 * @params {Array} or {Object} data
 * @params {string} role
 * basic class of all sketch lines
 * sketche's matrix is constant and the same with world
 */
function Sketch (name='line', keyPoints=[], parameters, role='sketch', closed=false) {

    THREE.Object3D.call(this);

    // General attributes
    this.type = 'Sketch';
    this.name = name;
    this.role = role;
    this.timeOrder = 0;
    this.closed = closed;
    this.selected = false;

    // Inner parameters
    this.pointSize = 1;
    this.width = 2;
    this.curveResolution = 50;
    if (lineMode == 'gl') {
        this.material = new THREE.LineBasicMaterial({linewidth: this.width,color:lineColors[role]});
    } else if (lineMode == 'tube') {
        this.material = new THREE.MeshBasicMaterial({color:lineColors[role]});
    }

    // construction data
    this.parameters = parameters;
    this.keyPoints = keyPoints;
    this.curve = null;

    // drawing data
    this.densePoints = [];
    this.denseLines = [];

    // computing data
    this.samplingPoints = [];
    this.samplingTangents = [];
    this.samplingNormalPlanes = [];
    
    // meshes
    this.pointMeshes = []
    this.curveMesh = null;

    // initialize only when the sketch has parameters or keypoints
    if (this.parameters || this.keyPoints.length) {
        this.buildMesh();
    }

}

Sketch.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: Sketch,

    clone: function () {
        return new Sketch().fromJSON(this.toJSON());
    },

    dispose: function () {
        this.traverse( function(obj) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                obj.material.dispose();
            }
        });
    },


    // Color controls

    setRole: function (role) {
        if (this.role == role) return;
        this.role = role;
        if (role == 'axis') {
            this.timeOrder = 0;
        }
        if (this.selected) {
            this.select();
        } else {
            this.deselect();
        }
    },

    setTimeOrder: function (i) {
        this.role = 'contour';
        this.timeOrder = i;
        this.setMaterialColor(timeOrderColors[i]);
    },

    select: function () {
        this.selected = true;
        this.setMaterialColor(lineColors.selected);
    },

    deselect: function () {
        this.selected = false;
        if (this.timeOrder > 0) {
            this.setMaterialColor(timeOrderColors[this.timeOrder]);
        } else {
            this.setMaterialColor(lineColors[this.role]);
        }
    },

    setMaterialColor: function (hex) {
        this.material.color.setHex(hex);
        for (pt of this.pointMeshes) {
            pt.material.color.setHex(hex);
        }
    },


    // Build geometry and meshes

    buildCurve: function () {
        // initialize the empty curve array
        this.curve = new THREE.CurvePath();
        
        if (this.parameters!== undefined) {
            let generateCurve = curveMap[this.name];
            let curve = generateCurve(this.parameters);
            this.curve.add(curve);
            this.closed = curve.closed;
        } else if (this.keyPoints.length>0) {
            
            switch(this.name) {
                case 'line':
                    // 
                    for (let i=0;i<this.keyPoints.length-1;i++) {
                        this.curve.add(new THREE.LineCurve3(this.keyPoints[i], this.keyPoints[i+1]));
                    }
                break;
                case 'spline':
                case 'brush2d':
                case 'brush3d':
                    let curve = new THREE.CatmullRomCurve3(this.keyPoints,this.closed);
                    curve.role = 'chordal';
                    this.curve.add(curve);
                break;
            }
        }
        this.curve.autoClose = this.closed;
    },

    buildGeometry: function () {
        // clear drawing data
        this.densePoints = [];
        this.denseLines = [];
        var geometry = null;

        // dynamic modify curveResolution based on curve length
        this.curveResolution = 10*Math.ceil(this.curve.getLength()+1);
        // update drawing data and serialize points
        this.densePoints = this.name=='line'? this.keyPoints:this.curve.getPoints( this.curveResolution );
        var n = this.densePoints.length;
        switch (lineMode) {
            case lineModes.gl:
                geometry = new THREE.Geometry();
                for (let i=0;i<n-1;i++) {
                    this.denseLines.push(new THREE.Line3(this.densePoints[i],this.densePoints[i+1]));
                    geometry.vertices.push(this.densePoints[i]);
                }
                geometry.vertices.push(this.densePoints[n-1]);
                if (this.curve.autoClose) {
                    geometry.vertices.push(this.densePoints[0]);
                }
            break;
            case lineModes.tube:
                for (let i=0;i<n-1;i++) {
                    this.denseLines.push(new THREE.Line3(this.densePoints[i],this.densePoints[i+1]));
                }
                if (this.curve.autoClose) {
                    this.denseLines.push(new THREE.Line3(this.densePoints[n-1],this.densePoints[0]));
                }
                geometry = new THREE.TubeBufferGeometry(this.curve,this.curveResolution/2,this.width/20,3,this.curve.autoClose);
            break;
        }
        return geometry;
    },

    buildPointMesh: function () {
        for (let p of this.keyPoints) {
            let pointGeometry = new THREE.BufferGeometry();
            pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
            let pointMesh = new THREE.Points(pointGeometry,new THREE.PointsMaterial( { color: this.material.color, size:this.pointSize } ));
            pointMesh.name = 'control point';
            // Layer 1: points
            pointMesh.layers.set(1);
            pointMesh.position.copy(p);
            this.pointMeshes.push(pointMesh);
            this.add(pointMesh);
        }
    },

    buildMesh: function () {
        
        // free old point meshes' materials and geometries
        for (pt of this.pointMeshes) {
            if (pt.material) {
                pt.material.dispose();
            }
            if (pt.geometry) {
                pt.geometry.dispose();
            }
        }
        this.pointMeshes = [];
        // free old curve mesh's geometry
        if (this.curveMesh) {
            this.curveMesh.geometry.dispose();
        }
        this.curveMesh = null;
        // clear children
        this.children = [];

        // build new curves
        this.setRole(this.role);
        this.buildCurve();

        // build meshes
        switch (lineMode) {
            case lineModes.gl:
                this.curveMesh = new THREE.Line(this.buildGeometry(), this.material);
            break;
            case lineModes.tube:
                this.curveMesh = new THREE.Mesh(this.buildGeometry(),this.material);
            break;
        }
        this.curveMesh.layers.set(2);
        this.curveMesh.name = 'sketch line';
        this.add(this.curveMesh);

        // build point meshes of for curves controlled by origin key points
        if (this.keyPoints.length>0) {
            this.buildPointMesh();
        }
    },

    // Computing geometries
    // reduce key points of free draw curves
    reduce: function () {
        if (this.name!='brush2d'&&this.name!='brush3d') return;
        //this.keyPoints = simplifyDP(simplifyPoly(simplifyALine(this.keyPoints)));
        this.keyPoints = simplifyDP(this.keyPoints, 5);
        this.name = 'spline';
        this.buildMesh();
    },

    // sampling results are world coordinate system (WCS) values
    sample: function (freq, type='curvature') {
        if (this.curve.getLength()==0) return;
        // clear computing data
        this.sampleRates = [];
        this.samplingPoints = [];
        this.samplingTangents = [];
        this.samplingNormalPlanes = [];
        let ff = null;
        let divisions = this.curve.autoClose ? freq : (freq - 1>0?freq-1:1);
        // sample
        for (let i = 0; i < freq; i++) {
            this.sampleRates.push(i/divisions);
            let pt,tg;
            if (type == 'average') {
                pt = this.curve.getPointAt(i/divisions).clone();
                tg = this.curve.getTangentAt(i/divisions).clone();
            } else if (type=='curvature') {
                pt = this.curve.getPoint(i/divisions).clone();
                tg = this.curve.getTangent(i/divisions).clone();
            }
            pt.applyMatrix4(this.curveMesh.matrix);
            tg.applyQuaternion(this.curveMesh.quaternion);
            tg.normalize();
            this.samplingPoints.push(pt);
            this.samplingTangents.push(tg);
        }
        if (this.curve.autoClose) {
            ff = this.curve.computeFrenetFrames(this.samplingPoints.length,this.curve.autoClose);
        } else {
            ff = this.curve.computeFrenetFrames(this.samplingPoints.length-1,this.curve.autoClose);
        }
        for (let i = 0;i<ff.tangents.length;i++) {
            ff.normals[i].applyQuaternion(this.curveMesh.quaternion);
            ff.binormals[i].applyQuaternion(this.curveMesh.quaternion);
            ff.tangents[i].applyQuaternion(this.curveMesh.quaternion);
        }
        this.ff = ff;
        // console.log(ff)
        // HELPER: draw sampling points and sampling normal planes
        for (let i=0;i<this.samplingPoints.length;i++) {
            // var box = new THREE.Mesh(new THREE.BoxBufferGeometry(1),new THREE.MeshBasicMaterial());
            // box.position.copy(this.samplingPoints[i]);
            // this.add(box);
            var plane = new THREE.Plane(this.samplingTangents[i])
            plane.translate(this.samplingPoints[i]);
            this.samplingNormalPlanes.push(plane);
            // var helper = new THREE.PlaneHelper( plane, 20, 0x00ffff );
            // this.add( helper );
        }
    },

    getReferencedFrames: function (curve, freq=50) {
        this.sample(freq);
        let tangents = [];
        let normals = [];
        let binormals = [];
        for (let i=0;i<this.samplingPoints.length;i++) {
            
            let planeCenter = this.samplingPoints[i].clone();
            let pt = curve.getNearestIntersection(planeCenter, this.samplingNormalPlanes[i]);
            if (!pt) {
                tangents.push(null);
                normals.push(null);
                binormals.push(null);
                continue;
            }
            
            let normal = pt.clone().sub(this.samplingPoints[i]).normalize();
            let binormal = this.samplingTangents[i].clone().cross(normal).normalize();
            tangents.push(this.samplingTangents[i]);
            normals.push(normal);
            binormals.push(binormal);
        }
        
        return {tangents: tangents, normals: normals, binormals: binormals};
    },

    // inaccurate
    getNearestIntersection: function (planeCenter, plane) {
        // TODO: use local plane to save computing cost
        // let center = this.curveMesh.worldToLocal(planeCenter.clone());
        // let normal = this.curveMesh.worldToLocal()
        let minDist = Infinity;
        let result = null;
        // get all intersecting points
        let points = this.getIntersections(planeCenter,plane);
        // return the nearest one
        for (let point of points) {
            let dist = point.distanceTo(planeCenter);
            if (dist<minDist) {
                result = point.clone();
                minDist = dist;
            }
        }
        return result;
    },

    getIntersections: function (planeCenter,plane,distance=Infinity) {
        let resultPoints = [];
        let tempPoint = new THREE.Vector3();
        for (line of this.denseLines) {
            let lineWorld = line.clone().applyMatrix4(this.curveMesh.matrix);
            if (plane.intersectLine(lineWorld,tempPoint)==undefined) {
                continue;
            }
            if (tempPoint.distanceTo(planeCenter)<distance) {
                resultPoints.push(tempPoint.clone());
            }
        }
        return resultPoints;
    },

    getNormalIntersectionsWithCurves: function (sketches,distance=Infinity) {
        let results = [];
        for (let i=0;i<this.samplingPoints.length;i++) {
            let intersections = [];
            let plane = this.samplingNormalPlanes[i];
            let center = this.samplingPoints[i];
            for (sketch of sketches) {
                let ist = sketch.getIntersections(center,plane,distance);
                if (ist.length>0) {
                    intersections.push(...ist);
                }
            }
            results.push(intersections);
        }
        return results;
    },

    // build skeletons with this sketches as the axis and other curves as sketches
    generateSkeleton: function (curves, dist = 1000, freq = 50 ) {
        // get sampling center and planes
        this.sample(freq);
        var skeletons = [];
        for (let c of curves) {
            var skeleton = c.intersectWithPlanes(this.samplingPoints, this.samplingNormalPlanes,dist);
            if(skeleton.length>0) skeletons.push(...skeleton);
        }
        return skeletons;
    },

    // get intersect points of this sketch and others' normal planes
    intersectWithPlanes: function (planeCenters, planes,dist=100) {
        if (planeCenters.length != planes.length) {
            alert('unequal lengths of plane and plane centers!');
            return;
        }
        var skeleton = [];
        for (let i=0;i<planes.length;i++) {
            var bones = this.intersectWithLimitedPlane(planeCenters[i],planes[i],dist);
            if (bones.length>0) skeleton.push(...bones);
        }
        
        return skeleton;
    },

    // get the intersect point of this sketch and another plane
    intersectWithLimitedPlane: function (planeCenter, plane, dist) {
        var point = new THREE.Vector3();
        // var bones = [];
        var unit = new Unit();
        var lines = [];
        for (line of this.denseLines) {
            lines.push(line.clone().applyMatrix4(this.matrix));
        }
        for (line of lines/* this.denseLines */) {
            if (!plane.intersectsLine(line)) {
                continue;
            } else {
                var pt = plane.intersectLine(line,point);
                if (pt.distanceTo(planeCenter)<dist) {
                    // old ksbone
                    // bones.push(new KSBone(planeCenter,pt,plane.normal));
                    // new rib
                    var end = new THREE.Vector3().subVectors(pt,planeCenter);
                    unit.addRib(end);
                }
            }
        }
        
        // return bones;
        return unit;
    },

    adjustTransform: function (pt,dir) {

    },

    toJSON: function () {
        return {
            name: this.name,
            role: this.role,
            timeOrder: this.timeOrder,
            colsed: this.closed,
            parameters: this.parameters,
            keyPoints: this.keyPoints.map(function(v){return v.toArray();}),
            matrix: this.matrix.toArray(),
        }
    },

    fromJSON: function (data) {
        this.name = data.name;
        this.role = data.role?data.role:'contour';
        this.timeOrder = data.timeOrder?data.timeOrder:0;
        this.closed = data.closed;
        this.parameters = data.parameters;
        this.keyPoints = data.keyPoints.map(function(v){return new THREE.Vector3().fromArray(v);});
        this.buildMesh();
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.setRole(data.role);
        return this;
    },
});