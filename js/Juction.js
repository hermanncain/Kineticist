function JunctionHelper( type='Rod', length = 1 ) {

    THREE.Object3D.call( this );

    let lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, 1 ], 3 ) );
    this.line = new THREE.Line( lineGeometry, junctionHelperMaterials[type] );
    this.line.matrixAutoUpdate = false;
    this.line.layers.set(3);
    this.add( this.line );

    this.setLength( length );

}

JunctionHelper.prototype = Object.create( THREE.Object3D.prototype );
JunctionHelper.prototype.constructor = JunctionHelper;

JunctionHelper.prototype.dispose = function () {

    this.line.geometry.dispose();

};

JunctionHelper.prototype.setLength = function ( length ) {

    this.line.scale.set( 1, 1, length);
    this.line.updateMatrix();

};

JunctionHelper.prototype.copy = function ( source ) {

    THREE.Object3D.prototype.copy.call( this, source, false );

    this.line.copy( source.line );

    return this;

};

JunctionHelper.prototype.clone = function () {

    return new this.constructor().copy( this );

};


/**
 * Junction
 * @param {string} type 
 * @param {float} theta 
 * @param {float} height 
 * @param {float} phase
 * @param {float} rSleeve 
 * @param {int} seg 
 * children:
 *  - envelope
 *  - skeleton
 *  - mechanism
 */
function Junction (type='Rod',theta=Math.PI/4,height=1,phase=0,rSleeve=0.1,seg=36) {
    THREE.Object3D.call(this);

    this.type = type;

    // built-in parameters
    this.rSleeve = rSleeve;
    this.seg = seg;

    // searching parameters
    this.theta = theta;
    this.height = height;
    this.phase = phase;

    // children
    this.envelope = null;
    this.skeleton = null;
    this.mechanism = null;

    this.initialize();
}

Junction.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
    constructor: Junction,

    clone: function () {
        // new junction will initialize, so an envelope has
        // already existed in the new junction
        let junction = new Junction(this.type,this.theta,this.h,this.phase,this.rSleeve,this.seg);
        if (this.skeleton) {
            junction.skeleton = this.skeleton.clone();
            junction.skeleton.applyMatrix(this.skeleton.matrix);
            junction.add(junction.skeleton);
        }
        if (this.mechanism) {
            junction.mechanism = this.mechanism.clone();
            junction.mechanism.applyMatrix(this.mechanism.matrix);
            junction.add(junction.mechanism);
        }
        junction.applyMatrix(this.matrix);
        return junction;
    },

    // clear envelope, skeleton and mechanism
    dispose: function () {
        if (this.envelope) {
            this.remove(this.envelope);
            this.envelope.geometry.dispose();
        }
        this.clear();
    },

    // clear skeleton and mechanism
    clear: function () {
        if (this.skelelton) {
            this.remove(this.skelelton);
            this.skelelton.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            });
            // this.remove(this.envelope);
        }
        if (this.mechanism) {
            this.remove(this.mechanism);
            this.mechanism.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            });
        }
    },

    // build

    initialize: function () {
        this.buildEnvelope(this.theta,this.height);
    },

    buildEnvelope: function (theta=Math.PI/3,height=1) {
        this.clearEnvelope();
        // update parameters
        this.theta = theta;
        this.height = height;
        // build
        let rMax = height * Math.tan(theta) + this.rSleeve;
        let envelopeGeometry = new THREE.CylinderGeometry(this.rSleeve,rMax,height,this.seg,1,true);
        if (this.type == 'Rod') {
            this.envelope = new THREE.Mesh(envelopeGeometry,rodFrustumMaterial);
            this.envelope.rotation.set(-Math.PI/2,0,0);
            this.envelope.position.set(0,0,this.height/2);
        } else if (this.type == 'Fork') {
            this.envelope = new THREE.Mesh(envelopeGeometry,forkFrustumMaterial);
            this.envelope.rotation.set(Math.PI/2,0,0);
            this.envelope.position.set(0,0,-this.height/2);
        }
        this.envelope.layers.set(5);
        this.add(this.envelope);
        this.envelope.updateMatrixWorld();
    },

    clearEnvelope: function () {
        if (this.envelope) {
            this.remove(this.envelope);
            this.envelope.geometry.dispose();
            this.envelope = null;
        }
    },

    buildSkeleton: function (phase=Math.PI/2) {
        if (this.skeleton) {
            this.skeleton.dispose();
            this.remove(this.skeleton);
        }
        this.phase=phase;
        let length = this.height / Math.cos(this.theta);
        this.skeleton = new JunctionHelper(this.type,length);
        this.skeleton.position.set(this.rSleeve,0,0);
        if (this.type == 'Rod') {
            this.skeleton.rotateY(this.theta);
        } else if (this.type == 'Fork') {
            this.skeleton.rotateY(Math.PI-this.theta);
        }
        this.rotation.set(0,0,this.phase);
        this.add(this.skeleton);
    },

    buildMechanism: function () {
        if (this.mechanism) {
            this.mechanism.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            });
            this.remove(this.mechanism);
        }
        if (!this.skeleton) {
            this.buildSkeleton();
        }

        // build
        let length = this.height / Math.cos(this.theta);
        let r0 = this.rSleeve*0.1;
        if (this.type=='Rod') {
            let rodGeometry = new THREE.CylinderBufferGeometry(r0,r0,length,8);
            rodGeometry.rotateX(Math.PI/2);
            rodGeometry.translate(0,0,length/2);
            let rod = new THREE.Mesh(rodGeometry,rodColoredMaterial);
            rod.name = 'unit-rod';
            rod.layers.set(4);
            this.add(rod);
            rod.position.copy(this.skeleton.position);
            rod.rotation.copy(this.skeleton.rotation);
            this.mechanism = rod;
        } else if (this.type == 'Fork') {
            let forkMinLength = 0.3*length;
            let barGeo = new THREE.CylinderGeometry(r0,r0,forkMinLength);
            barGeo.translate(0,forkMinLength/2,0);
            let baseGeo = new THREE.BoxGeometry(2*r0,2*r0,6*r0);
            baseGeo.translate(0,forkMinLength-r0,0);
            barGeo.merge(baseGeo);
            let geo1 = new THREE.CylinderGeometry(r0,r0,0.7*length);
            let geo2 = geo1.clone()
            geo1.translate(0,(length + forkMinLength)/2,2.2*r0);
            geo2.translate(0,(length + forkMinLength)/2,-2.2*r0);
            barGeo.merge(geo1);
            barGeo.merge(geo2);
            let forGeometry = new THREE.BufferGeometry();
            forGeometry.fromGeometry(barGeo);
            forGeometry.rotateX(Math.PI/2)
            let fork = new THREE.Mesh(forGeometry,forkColoredMaterial);
            fork.name = 'unit-fork';
            fork.layers.set(4);
            this.add(fork);
            fork.position.copy(this.skeleton.position);
            fork.rotation.copy(this.skeleton.rotation);
            this.mechanism = fork;
        }
    },


    // computation

    checkConnection: function (junction) {
        let env1 = this.envelope;
        let env2 = junction.envelope;
        let n = env1.geometry.vertices.length/2;
        // if there are unknown raycast bugs, additional flag is employed to garuantee intersections
        // let flag = -1;
        for (let j=0;j<n;j++) {
            if (generatrixIntersection(env1, env2,0.95,n,j)) {
                // connected
                continue;
            } else {
                // flag's usage: to garuantee that
                // only continuous (i.e. j,j+1) disconnections are seen as separations
                
                // if (flag == -1) {
                //     flag = j;
                // } else if (flag==j-1) {
                //     // console.log('sparated')
                //     return false;
                // }
                return false;
            }
        }
        return true;
    },


    // export/import

    toJSON: function () {
        return {
            type: this.type,
            theta: this.theta,
            height: this.height,
            phase: this.phase,
            rSleeve: this.rSleeve,
            seg: this.seg
        }
    },

    fromJSON: function (data){
        this.dispose();
        this.type = data.type;
        this.theta = data.theta;
        this.phase = phase;
        this.rSleeve = rSleeve;
        this.seg = seg;
        this.initialize();
        this.buildSkeleton(this.phase);
        this.buildMechanism();
    },

});
