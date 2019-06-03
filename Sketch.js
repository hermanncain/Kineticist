/**
 * @class Sketch
 * basic class of all sketch lines
 */

const lineColors = {selected:0xffaa00, axis:0xff0000, contour:0x0000ff, reference:0x00ff00};
const lineModes = {gl:'gl', fatline:'fatline', tube:'tube'};
var lineMode = lineModes.tube;
const lineWidths = {contour:1, axis:2, selected:3};

function Sketch (curveName='line', keyPoints=[], parameters, curveType='contour') {

    THREE.Object3D.call(this);

    // general attributes
    // sketch information
    this.type = 'sketch';
    this.curveType = curveType; //axis or contour
    // this.closed = false;
    this.selected = false;
    // key points
    this.pointSize = 0.3;
    // lines
    this.width = 2;
    this.curveResolution = 50;
    this.materials = {
        //due to the webgl remaining issue, width won't work
        gl: new THREE.LineBasicMaterial({linewidth: this.width,color:0x0000ff}),
        fatline: new THREE.LineMaterial( {linewidth: this.width, resolution:new THREE.Vector2(500,500),color:0x0000ff} ),
        tube: new THREE.MeshBasicMaterial({color:0x0000ff}),
        // point: new THREE.MeshBasicMaterial()
    };
    // basic data
    this.name = curveName;
    this.parameters = parameters;
    this.keyPoints = keyPoints;
    this.curve = null;

    // secondary data
    // draw related
    this.densePoints = [];
    this.denseLines = [];

    // computing data
    // skeleton related
    this.samplingPoints = [];
    this.samplingTangents = [];
    this.samplingNormalPlanes = [];
    
    // meshes
    this.pointMeshes = []//new THREE.Group();

    // initialize only when the sketch has parameters or keypoints
    if (this.parameters || this.keyPoints.length) {
        this.buildMesh();
    }

}

Sketch.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: Sketch,

    setCurveType: function (type) {
        if (this.curveType == type) return;
        this.curveType = type;
        if (this.selected) {
            this.select();
        } else {
            this.deselect();
        }
    },

    select: function () {
        this.selected = true;
        switch (lineMode) {
            // fatline: wider line
            case lineModes.fatline:
                this.width = lineWidths.selected;
            break;
            // tube: light effect on
            case lineModes.tube:
            break;
        }
        this.setMaterialColor(lineColors.selected);
    },

    deselect: function () {
        this.selected = false;
        switch (lineMode) {
            // fatline: wider line
            case lineModes.fatline:
                this.width = lineWidths[this.curveType];
            break;
            // tube: light effect on
            case lineModes.tube:
            break;
        }
        this.setMaterialColor(lineColors[this.curveType]);
    },

    setMaterialColor: function (hex) {
        for (key in this.materials) {
            this.materials[key].color.setHex(hex);
        }
        for (pt of this.pointMeshes) {
            pt.material.color.setHex(hex);
        }
    },

    buildCurve: function () {
        // initialize the empty curve array
        this.curve = new THREE.CurvePath();
        // conditions
        if (this.parameters!== undefined) {
            let generateCurve = curveMap[this.name];
            let curve = generateCurve(this.parameters);
            this.curve.add(curve);
            if(curve.closed) {
                this.curve.autoClose = true;
            };
        } else {
            switch(this.name) {
                case 'line':
                    // this.curve = new THREE.CurvePath();
                    for (let i=0;i<this.keyPoints.length-1;i++) {
                        this.curve.add(new THREE.LineCurve3(this.keyPoints[i], this.keyPoints[i+1]));
                    }
                break;
                case 'spline':
                case 'brush2d':
                case 'brush3d':
                    let curve = new THREE.CatmullRomCurve3(this.keyPoints);
                    curve.curveType = 'chordal';
                    this.curve.add(curve);
                break;
            }
            // this.is2D = true;
        }
    },

    buildGeometry: function () {
        // clear secondary data
        this.densePoints = [];
        this.denseLines = [];
        var geometry = null;

        // dynamic modify curveResolution based on curve length
        this.curveResolution = 10*Math.ceil(this.curve.getLength()+1);
        // update secondary data and serialize points
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
            break;
            case lineModes.fatline:
                geometry = new THREE.LineGeometry();
                var pts = [];
                for (let i=0;i<n-1;i++) {
                    this.denseLines.push(new THREE.Line3(this.densePoints[i],this.densePoints[i+1]));
                    pts.push(this.densePoints[i].x,this.densePoints[i].y,this.densePoints[i].z);
                }
                pts.push(this.densePoints[n-1].x,this.densePoints[n-1].y,this.densePoints[n-1].z);
                geometry.setPositions( pts );
            break;
            case lineModes.tube:
                for (let i=0;i<n-1;i++) {
                    this.denseLines.push(new THREE.Line3(this.densePoints[i],this.densePoints[i+1]));
                }
                geometry = new THREE.TubeBufferGeometry(this.curve,this.curveResolution/2,this.width/20,3,this.curve.autoClose);
            break;
        }
        return geometry;
    },

    buildPointMesh: function () {
        // clear old point meshes
        for (pm of this.pointMeshes) {
            this.remove(pm);
        }
        this.pointMeshes = [];
        // push new point meshes
        for (let p of this.keyPoints) {
            let pointGeometry = new THREE.BufferGeometry();
            pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
            let pointMesh = new THREE.Points(pointGeometry,new THREE.PointsMaterial( { color: this.materials.gl.color } ));
            pointMesh.name = 'control point';
            // Layer 1: points
            pointMesh.layers.set(1);
            pointMesh.position.copy(p);
            this.pointMeshes.push(pointMesh);
            this.add(pointMesh);
        }
    },

    buildMesh: function () {
        
        // clear meshes
        this.children = [];

        // build curves
        this.setCurveType(this.curveType);
        this.buildCurve();

        switch (lineMode) {
            case lineModes.gl:
                var line = new THREE.Line(this.buildGeometry(), this.materials[lineMode]);
                line.layers.set(2);
                line.name = 'sketch line';
                this.add(line);
            break;
            case lineModes.fatline:
                var line = new THREE.FatLine(this.buildGeometry(),this.materials[lineMode]);
                line.layers.set(2);
                line.name = 'sketch line';
                line.computeLineDistances();
                this.add(line);
            break;
            case lineModes.tube:
                var line = new THREE.Mesh(this.buildGeometry(),this.materials[lineMode]);
                line.layers.set(2);
                line.name = 'sketch line';
                this.add(line);
            break;
        }

        // build point meshes of for curves controlled by origin key points
        if (this.name=='line'||this.name=='spline') {
            this.buildPointMesh();
        }
    },

    // reduce key points of free draw curves
    reduce: function () {
        if (this.name!='brush2d'&&this.name!='brush3d') return;
        //this.keyPoints = simplifyDP(simplifyPoly(simplifyALine(this.keyPoints)));
        this.keyPoints = simplifyDP(this.keyPoints, 5);
        this.name = 'spline';
        this.buildMesh();
    },

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
            pt.applyMatrix4(this.children[0].matrix);
            tg.applyQuaternion(this.children[0].quaternion);
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
            ff.normals[i].applyQuaternion(this.children[0].quaternion);
            ff.binormals[i].applyQuaternion(this.children[0].quaternion);
            ff.tangents[i].applyQuaternion(this.children[0].quaternion);
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
            let pt = curve.intersectWithWidePlane(planeCenter, this.samplingNormalPlanes[i]);
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

    intersectWithWidePlane: function (planeCenter, plane) {
        var point = new THREE.Vector3();
        var lines = [];
        let minDist = 1000;
        let r = null;
        for (line of this.denseLines) {
            lines.push(line.clone().applyMatrix4(this.matrix));
        }
        for (line of lines) {
            if (!plane.intersectsLine(line)) {
                continue;
            } else {
                plane.intersectLine(line,point);
                let dist = point.distanceTo(planeCenter);
                if (dist<minDist) {
                    r = point.clone();
                    minDist = dist;
                }
            }
        }
        return r;
    },

    // build skeletons with this sketches as the axis and other curves as contours
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
    intersectWithPlanes: function (planeCenters, planes,dist) {
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
            curveType: this.curveType,
            parameters: this.parameters,
            keyPoints: this.keyPoints.map(function(v){return v.toArray();}),
            matrix: this.matrix.toArray(),
        }
    },

    fromJSON: function (data) {
        this.name = data.name;
        // this.curveType = data.curveType;
        this.parameters = data.parameters;
        this.keyPoints = data.keyPoints.map(function(v){return new THREE.Vector3().fromArray(v);});
        this.buildMesh();
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.setCurveType(data.curveType);
        return this;
    },
});