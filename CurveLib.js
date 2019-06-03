/**
 * Library of curves and surfaces
 * @author hermanncain / https://hermanncain.github.io/
 */

// parametric curve map
var curveMap = {
    'Ellipse': function (params) {
        return new Ellipse(params[0],params[1],params[2],params[3],params[4],params[5],params[6],params[7]);
    },
    'Heart': function (params) {
        return new Heart(params[0]);
    },
    'Sin': function  (params) {
        return new Sin(params[0],params[1],params[2],params[3],params[4]);
    },
    'Spiral': function (params) {
        return new Spiral(params[0],params[1],params[2],params[3]);
    },
    'TorusKnot': function (params) {
        return new TorusKnot(params[0],params[1],params[2],params[3]);
    },
    'DecoratedTorusKnot': function (params) {
        return new DecoratedTorusKnot(params[0],params[1],params[2],params[3],params[4],params[5],params[6]);
    },
    'GrannyKnot': function (params) {
        return new GrannyKnot(params[0]);
    }
}

// CURVES

// 2D Curves

// ellipse
// tags: 2d, closed
function Ellipse( aX=0, aY=0, xRadius=1, yRadius=1, aStartAngle=0, aEndAngle=2 * Math.PI, aClockwise=false, aRotation=0 ) {

    THREE.Curve.call( this );

    this.is2D = true;
    this.closed = true;

    this.aX = aX;
    this.aY = aY;

    this.xRadius = xRadius;
    this.yRadius = yRadius;

    this.aStartAngle = aStartAngle/180*2*Math.PI;
    this.aEndAngle = aEndAngle/180*2*Math.PI;

    this.aClockwise = aClockwise;

    this.aRotation = aRotation/180*2*Math.PI;

}

Ellipse.prototype = Object.assign(Object.create( THREE.Curve.prototype ), {
    constructor: Ellipse,
    getPoint: function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();

		var twoPi = Math.PI * 2;
		var deltaAngle = this.aEndAngle - this.aStartAngle;
		var samePoints = Math.abs( deltaAngle ) < Number.EPSILON;

		// ensures that deltaAngle is 0 .. 2 PI
		while ( deltaAngle < 0 ) deltaAngle += twoPi;
		while ( deltaAngle > twoPi ) deltaAngle -= twoPi;

		if ( deltaAngle < Number.EPSILON ) {

			if ( samePoints ) {

				deltaAngle = 0;

			} else {

				deltaAngle = twoPi;

			}

		}

		if ( this.aClockwise === true && ! samePoints ) {

			if ( deltaAngle === twoPi ) {

				deltaAngle = - twoPi;

			} else {

				deltaAngle = deltaAngle - twoPi;

			}

		}

		var angle = this.aStartAngle + t * deltaAngle;
		var x = this.aX + this.xRadius * Math.cos( angle );
		var y = this.aY + this.yRadius * Math.sin( angle );

		if ( this.aRotation !== 0 ) {

			var cos = Math.cos( this.aRotation );
			var sin = Math.sin( this.aRotation );

			var tx = x - this.aX;
			var ty = y - this.aY;

			// Rotate the point about the center of the ellipse.
			x = tx * cos - ty * sin + this.aX;
			y = tx * sin + ty * cos + this.aY;

		}

		return point.set( x, y, 0 );
    
    },

    toJSON: function () {

    },
});

// TODO
// parabola
// tags: 2d, unclosed
// hyperbola
// tags: 2d, unclosed

// heart
// tags: 2d, closed
function Heart( scale=5 ) {

    THREE.Curve.call( this );

    this.is2D = true;
    this.closed = true;

    this.scale = scale;

}

Heart.prototype = Object.assign(Object.create( THREE.Curve.prototype ), {
    constructor: Heart,
    getPoint: function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();
    
        t *= 2 * Math.PI;
    
        var x = 16 * Math.pow( Math.sin( t ), 3 );
        var y = 13 * Math.cos( t ) - 5 * Math.cos( 2 * t ) - 2 * Math.cos( 3 * t ) - Math.cos( 4 * t );
        var z = 0;
    
        return point.set( x, y, z ).multiplyScalar( this.scale );
    
    }
});

// sin
// tags: 2d, unclosed
function Sin( a=1, f=1, p=0, t1=0, t2=Math.PI*2 ) {

    THREE.Curve.call( this );

    this.is2D = true;
    this.closed = false;
    
    this.a = a;
    this.f = f;
    this.p = p;
    this.t1 = t1;
    this.t2 = t2;

}

Sin.prototype = Object.assign(Object.create( THREE.Curve.prototype ), {
    constructor: Sin,
    getPoint: function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();
    
        t = t * (this.t2 - this.t1)/180*Math.PI + this.t1/180*Math.PI;

	    var y = this.a * Math.sin( t * this.f + this.p/180*Math.PI);
	    var z = 0;
    
        return point.set( t, y, z );
    
    }
});

// 2 Space Curves

// 2.1 Classical space curves

// helix
function Spiral( r=1, dr=0, da=0, n=1 ) {

    THREE.Curve.call( this );

    this.is2D = da==0?true:false;
    this.closed = false;

    this.r = r;
    this.dr = dr;
    this.da = da;
    this.n = n;

}

Spiral.prototype = Object.assign(Object.create( THREE.Curve.prototype ), {

    constructor: Spiral,

    getPoint: function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();
        var t2 = 2 * Math.PI * t * this.n;
        var x = Math.cos( t2 ) * this.r + t2*Math.cos( t2 ) * this.dr;
        var y = Math.sin( t2 ) * this.r + t2*Math.sin( t2 ) *this.dr;
        var z = this.da * t2;
    
        return point.set( x, y, z );
    
    },

});

// TODO
// lissajous space curve
// intersection of 2 cylinders


// 2.2 Knots

// torus knot
function TorusKnot( r, tr, p, q ) {

    THREE.Curve.call( this );

    this.is2D = false;
    this.closed = true;
    
    this.r = r||5;
    this.tr = tr||2;
    this.p = p||2;
    this.q = q||3;

}

TorusKnot.prototype = Object.assign(Object.create(THREE.Curve.prototype), {
    constructor: TorusKnot,
    
    getPoint: function ( t, optionalTarget ) {

		var point = optionalTarget || new THREE.Vector3();

		t *= Math.PI * 2;

		var x = ( this.r+this.tr*Math.cos( this.q * t ) ) * Math.cos( this.p * t );
		var y = ( this.r+this.tr*Math.cos( this.q * t ) ) * Math.sin( this.p * t );
		var z = this.tr*Math.sin( this.q * t );

		return point.set( x, y, z );

	}
});

// decorative knot
function DecoratedTorusKnot( /*r, */p1, p2, p3, p4, p5, p6, p7 ) {

    THREE.Curve.call( this );

    this.is2D = false;
    this.closed = true;

    // this.r = ( r === undefined ) ? 1 : r;
    this.params = [p1,p2,p3,p4,p5,p6,p7];

}

DecoratedTorusKnot.prototype = Object.assign( Object.create( THREE.Curve.prototype ), {
    constructor: DecoratedTorusKnot,

    getPoint: function ( t, optionalTarget ) {

        var point = optionalTarget || new THREE.Vector3();
    
        t *= Math.PI * 2;
    
        var x = Math.cos( this.params[0] * t ) * ( 1 + this.params[1] * ( Math.cos( this.params[2] * t ) + this.params[3] * Math.cos( this.params[4] * t ) ) );
        var y = Math.sin( this.params[0] * t ) * ( 1 + this.params[1] * ( Math.cos( this.params[2] * t ) + this.params[3] * Math.cos( this.params[4] * t ) ) );
        var z = this.params[5] * Math.sin( this.params[6] * t );
    
        return point.set( x, y, z ).multiplyScalar( 4 );
    
    }
});

// Granny Knot
function GrannyKnot() {

    THREE.Curve.call( this );

    this.is2D = false;
    this.closed = true;

}
GrannyKnot.prototype = Object.assign(Object.create(THREE.Curve.prototype), {
    constructor: GrannyKnot,
    getPoint: function (t, optionalTarget) {
        var point = optionalTarget || new THREE.Vector3();

        t = 2 * Math.PI * t;

        var x = - 0.22 * Math.cos( t ) - 1.28 * Math.sin( t ) - 0.44 * Math.cos( 3 * t ) - 0.78 * Math.sin( 3 * t );
        var y = - 0.1 * Math.cos( 2 * t ) - 0.27 * Math.sin( 2 * t ) + 0.38 * Math.cos( 4 * t ) + 0.46 * Math.sin( 4 * t );
        var z = 0.7 * Math.cos( 3 * t ) - 0.4 * Math.sin( 3 * t );

        return point.set( x, y, z );//.multiplyScalar( 20 );
    }
});

// TODO
// genus 2 knot
// Square Knot

// 2.3 Curves on sphere

// loxodrome

// spherical ellipse

// 2.4 Differential geometry

// constant curvature curve


// SURFACES

var surfaceMap = {};

// plane

// 3.1 Famous surfaces

// 3.1.1 Non-Orientable Surfaces

// Mobius Strip
// tags: 

// Klein Bottle
// tags: 

// 3.1.2 Pseudospherical Surfaces (K = -1)

// Hyperbolic K=-1 Surface of Revolution
// tags: 

// 3.1.3 Spherical Surfaces (K = 1)

// K=1 Surface of Revolution
// tags: 

// 3.1.4 Quadratic Surfaces

// Paraboloid
// tags: 

// Hyperbolic Paraboloid

// Hyperboloid of One Sheet

// Hyperboloid of Two Sheet

// Sphere
// tags:

// 3.1.5 Torus

// Torus
// tags:

// Cyclide

// Bianchi-Pinkall Flat Tori

// Clifford Torus

// Hopf Fibered Linked Tori

// 3.1.6 Miscellaneous

// Dirac Belt

// Monkey Saddle

// 3.1.7 Implicit Algebraic Surfaces

// 3.1.7.1 Non-Compact with Singularities

// 3.1.7.2 Compact with larger Genus


// 3.2 Minimal surfaces

// 3.2.1 Classic

// Catenoid

// Helicoid-Catenoid

// Scherk Surface

// Enneper Surface

// Riemann's Surface

// 3.2.2 Punctured Sphere

// Double Enneper

// Wavy Enneper Surface

// Planar Enneper

// Catenoid-Enneper

// Symmetric 4-noid

// Skew 4-noid

// 3.2.3 Punctured Torus

// Chen Gackstatter

// Costa Surface

// Karcher JE Saddle Towe

// Karcher JD Saddle tower

// Costa-Hoffman-Meeks Surface

// 3.2.4 Triply Periodic Minimal Surfaces

// TODO

// Skeleton
// Duoprism
// TODO