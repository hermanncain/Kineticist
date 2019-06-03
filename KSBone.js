// skeleton
function KSBone (origin, point, dir) {
    THREE.Object3D.call(this);

    this.boneMaterial = new THREE.LineMaterial({color:0x00ccff, linewidth: 1, resolution:new THREE.Vector2(500,500)});
    this.glMaterial = new THREE.LineBasicMaterial({color: 0x00ccff, linewidth: 1});
    var startPoint = new THREE.Vector3();
    var endPoint = new THREE.Vector3().subVectors(point,origin);
    this.position.copy(origin);
    this.dir = dir;
    this.buildBone('line', [startPoint, endPoint]);
}

KSBone.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
    constructor: KSBone,

    buildBone: function (type,params) {
        if (type == 'line') {
            this.buildLineBone(params[0],params[1])
        }
        // TODO: other bone shapes
    },

    buildLineBone: function (p1,p2) {
        var sphereMat = new THREE.MeshBasicMaterial({color:0x00ccff});
        var sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2),sphereMat);
        sphere.position.copy(p2);
        sphere.layers.set(3);
        this.add(sphere);
        switch (lineMode) {
            case lineModes.gl:
                var geometry = new THREE.Geometry();
                geometry.vertices.push(p1);
                geometry.vertices.push(p2);
                var line = new THREE.Line(geometry,this.glMaterial);
                line.layers.set(3);
                this.add(line);
                break;
            case lineModes.fatline:
                var pts = [];
                pts.push(p1.x,p1.y,p1.z);
                pts.push(p2.x,p2.y,p2.z);
                var geometry = new THREE.LineGeometry();
                geometry.setPositions( pts );
                var line = new THREE.FatLine(geometry,this.boneMaterial);
                line.layers.set(3);
                line.computeLineDistances();
                this.add(line);
                break;
            case lineModes.tube:
            break;
        }
    },

    // IMPORTANT: different yaw lead to totally different effect!
    simulate: function (v=0.01, yaw=0) {
        this.rotateOnAxis(this.dir, v);
    }
});