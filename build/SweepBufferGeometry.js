// SweepBufferGeometry

function SweepBufferGeometry( shapes, options ) {

    THREE.BufferGeometry.call( this );

    this.type = 'SweepBufferGeometry';

    this.parameters = {
        shapes: shapes,
        options: options
    };

    shapes = Array.isArray( shapes ) ? shapes : [ shapes ];

    var scope = this;

    var verticesArray = [];
    var uvArray = [];

    for ( var i = 0, l = shapes.length; i < l; i ++ ) {

        var shape = shapes[ i ];
        addShape( shape );

    }

    // build geometry

    this.addAttribute( 'position', new THREE.Float32BufferAttribute( verticesArray, 3 ) );
    this.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvArray, 2 ) );

    this.computeVertexNormals();

    // functions

    function addShape( shape ) {

        var placeholder = [];

        // options

        // section shapes
        var curveSegments = options.curveSegments !== undefined ? options.curveSegments : 8;

        // bevel
        var bevelEnabled = options.bevelEnabled !== undefined ? options.bevelEnabled : true;
        var bevelThickness = options.bevelThickness !== undefined ? options.bevelThickness : 6;
        var bevelSize = options.bevelSize !== undefined ? options.bevelSize : bevelThickness - 2;
        var bevelSegments = options.bevelSegments !== undefined ? options.bevelSegments : 3;

        // sweeping path
        var sweepPath = options.sweepPath;
        var steps = options.steps !== undefined ? options.steps : 1;
        var depth = options.depth !== undefined ? options.depth : 100;

        // section shape twists and scales along/around the sweeping path
        var twists = options.twists;
        var scales = options.scales;

        // clipping
        var clipping = options.clipping?options.clipping:0;

        var uvgen = options.UVGenerator !== undefined ? options.UVGenerator : WorldUVGenerator;

        //

        var sweepPts, sweepByPath = false;
        var splineTube, binormal, normal, position2;
        // var clippedStart = clipping? clipping : 0;

        if ( sweepPath ) {

            sweepPts = sweepPath.getSpacedPoints( steps );

            sweepByPath = true;
            bevelEnabled = false; // bevels not supported for path extrusion

            // SETUP TNB variables

            // TODO1 - have a .isClosed in spline?

            splineTube = sweepPath.computeFrenetFrames( steps, false );

            // console.log(splineTube, 'splineTube', splineTube.normals.length, 'steps', steps, 'sweepPts', sweepPts.length);

            binormal = new THREE.Vector3();
            normal = new THREE.Vector3();
            position2 = new THREE.Vector3();

        }

        // Safeguards if bevels are not enabled

        if ( ! bevelEnabled ) {

            bevelSegments = 0;
            bevelThickness = 0;
            bevelSize = 0;

        }

        // Variables initialization

        var ahole, h, hl; // looping of holes

        var shapePoints = shape.extractPoints( curveSegments );

        var vertices = shapePoints.shape;
        var holes = shapePoints.holes;

        var reverse = ! THREE.ShapeUtils.isClockWise( vertices );

        if ( reverse ) {

            vertices = vertices.reverse();

            // Maybe we should also check if holes are in the opposite direction, just to be safe ...

            for ( h = 0, hl = holes.length; h < hl; h ++ ) {

                ahole = holes[ h ];

                if ( THREE.ShapeUtils.isClockWise( ahole ) ) {

                    holes[ h ] = ahole.reverse();

                }

            }

        }


        var faces = THREE.ShapeUtils.triangulateShape( vertices, holes );

        /* Vertices */

        var contour = vertices; // vertices has all points but contour has only points of circumference

        for ( h = 0, hl = holes.length; h < hl; h ++ ) {

            ahole = holes[ h ];

            vertices = vertices.concat( ahole );

        }


        function scalePt2( pt, vec, size ) {

            if ( ! vec ) console.error( "THREE.SweepGeometry: vec does not exist" );

            return vec.clone().multiplyScalar( size ).add( pt );

        }

        var b, bs, t, z,
            vert, vlen = vertices.length,
            face, flen = faces.length;

        // Find directions for point movement


        function getBevelVec( inPt, inPrev, inNext ) {

            // computes for inPt the corresponding point inPt' on a new contour
            //   shifted by 1 unit (length of normalized vector) to the left
            // if we walk along contour clockwise, this new contour is outside the old one
            //
            // inPt' is the intersection of the two lines parallel to the two
            //  adjacent edges of inPt at a distance of 1 unit on the left side.

            var v_trans_x, v_trans_y, shrink_by; // resulting translation vector for inPt

            // good reading for geometry algorithms (here: line-line intersection)
            // http://geomalgorithms.com/a05-_intersect-1.html

            var v_prev_x = inPt.x - inPrev.x,
                v_prev_y = inPt.y - inPrev.y;
            var v_next_x = inNext.x - inPt.x,
                v_next_y = inNext.y - inPt.y;

            var v_prev_lensq = ( v_prev_x * v_prev_x + v_prev_y * v_prev_y );

            // check for collinear edges
            var collinear0 = ( v_prev_x * v_next_y - v_prev_y * v_next_x );

            if ( Math.abs( collinear0 ) > Number.EPSILON ) {

                // not collinear

                // length of vectors for normalizing

                var v_prev_len = Math.sqrt( v_prev_lensq );
                var v_next_len = Math.sqrt( v_next_x * v_next_x + v_next_y * v_next_y );

                // shift adjacent points by unit vectors to the left

                var ptPrevShift_x = ( inPrev.x - v_prev_y / v_prev_len );
                var ptPrevShift_y = ( inPrev.y + v_prev_x / v_prev_len );

                var ptNextShift_x = ( inNext.x - v_next_y / v_next_len );
                var ptNextShift_y = ( inNext.y + v_next_x / v_next_len );

                // scaling factor for v_prev to intersection point

                var sf = ( ( ptNextShift_x - ptPrevShift_x ) * v_next_y -
                        ( ptNextShift_y - ptPrevShift_y ) * v_next_x ) /
                    ( v_prev_x * v_next_y - v_prev_y * v_next_x );

                // vector from inPt to intersection point

                v_trans_x = ( ptPrevShift_x + v_prev_x * sf - inPt.x );
                v_trans_y = ( ptPrevShift_y + v_prev_y * sf - inPt.y );

                // Don't normalize!, otherwise sharp corners become ugly
                //  but prevent crazy spikes
                var v_trans_lensq = ( v_trans_x * v_trans_x + v_trans_y * v_trans_y );
                if ( v_trans_lensq <= 2 ) {

                    return new THREE.Vector2( v_trans_x, v_trans_y );

                } else {

                    shrink_by = Math.sqrt( v_trans_lensq / 2 );

                }

            } else {

                // handle special case of collinear edges

                var direction_eq = false; // assumes: opposite
                if ( v_prev_x > Number.EPSILON ) {

                    if ( v_next_x > Number.EPSILON ) {

                        direction_eq = true;

                    }

                } else {

                    if ( v_prev_x < - Number.EPSILON ) {

                        if ( v_next_x < - Number.EPSILON ) {

                            direction_eq = true;

                        }

                    } else {

                        if ( Math.sign( v_prev_y ) === Math.sign( v_next_y ) ) {

                            direction_eq = true;

                        }

                    }

                }

                if ( direction_eq ) {

                    // console.log("Warning: lines are a straight sequence");
                    v_trans_x = - v_prev_y;
                    v_trans_y = v_prev_x;
                    shrink_by = Math.sqrt( v_prev_lensq );

                } else {

                    // console.log("Warning: lines are a straight spike");
                    v_trans_x = v_prev_x;
                    v_trans_y = v_prev_y;
                    shrink_by = Math.sqrt( v_prev_lensq / 2 );

                }

            }

            return new THREE.Vector2( v_trans_x / shrink_by, v_trans_y / shrink_by );

        }


        var contourMovements = [];

        for ( var i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

            if ( j === il ) j = 0;
            if ( k === il ) k = 0;

            //  (j)---(i)---(k)
            // console.log('i,j,k', i, j , k)

            contourMovements[ i ] = getBevelVec( contour[ i ], contour[ j ], contour[ k ] );

        }

        var holesMovements = [],
            oneHoleMovements, verticesMovements = contourMovements.concat();

        for ( h = 0, hl = holes.length; h < hl; h ++ ) {

            ahole = holes[ h ];

            oneHoleMovements = [];

            for ( i = 0, il = ahole.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

                if ( j === il ) j = 0;
                if ( k === il ) k = 0;

                //  (j)---(i)---(k)
                oneHoleMovements[ i ] = getBevelVec( ahole[ i ], ahole[ j ], ahole[ k ] );

            }

            holesMovements.push( oneHoleMovements );
            verticesMovements = verticesMovements.concat( oneHoleMovements );

        }


        // Loop bevelSegments, 1 for the front, 1 for the back

        for ( b = 0; b < bevelSegments; b ++ ) {

            //for ( b = bevelSegments; b > 0; b -- ) {

            t = b / bevelSegments;
            z = bevelThickness * Math.cos( t * Math.PI / 2 );
            bs = bevelSize * Math.sin( t * Math.PI / 2 );

            // contract shape

            for ( i = 0, il = contour.length; i < il; i ++ ) {

                vert = scalePt2( contour[ i ], contourMovements[ i ], bs );

                v( vert.x, vert.y, - z );

            }

            // expand holes

            for ( h = 0, hl = holes.length; h < hl; h ++ ) {

                ahole = holes[ h ];
                oneHoleMovements = holesMovements[ h ];

                for ( i = 0, il = ahole.length; i < il; i ++ ) {

                    vert = scalePt2( ahole[ i ], oneHoleMovements[ i ], bs );

                    v( vert.x, vert.y, - z );

                }

            }

        }

        bs = bevelSize;

        // Back facing vertices

        for ( i = 0; i < vlen; i ++ ) {

            vert = bevelEnabled ? scalePt2( vertices[ i ], verticesMovements[ i ], bs ) : vertices[ i ];
            
            // shape scale and rotation
            let controlVert = vert.clone();
            if (scales) {
                controlVert.x = vert.x * scales[clipping].x;
                controlVert.y = vert.y * scales[clipping].y;
            }
            if (twists) {
                controlVert.rotateAround(new THREE.Vector2(),twists[clipping]);
            }

            if ( ! sweepByPath ) {

                v( vert.x, vert.y, 0 );

            } else {

                // v( vert.x, vert.y + sweepPts[ 0 ].y, sweepPts[ 0 ].x );

                normal.copy( splineTube.normals[ clipping ] ).multiplyScalar( controlVert.x );
                binormal.copy( splineTube.binormals[ clipping ] ).multiplyScalar( controlVert.y );

                position2.copy( sweepPts[ clipping ] ).add( normal ).add( binormal );
                v( position2.x, position2.y, position2.z );

            }

        }

        // Add stepped vertices...
        // Including front facing vertices

        var s;

        for ( s = clipping + 1; s <= steps; s ++ ) {

            for ( i = 0; i < vlen; i ++ ) {

                vert = bevelEnabled ? scalePt2( vertices[ i ], verticesMovements[ i ], bs ) : vertices[ i ];
                
                // shape scale and rotation
                let controlVert = vert.clone();
                if (scales) {
                    controlVert.x = vert.x * scales[s].x;
                    controlVert.y = vert.y * scales[s].y;
                }
                if (twists) {
                    controlVert.rotateAround(new THREE.Vector2(),twists[s]);
                }
                
                if ( ! sweepByPath ) {

                    v( vert.x, vert.y, depth / steps * s );

                } else {

                    // v( vert.x, vert.y + sweepPts[ s - 1 ].y, sweepPts[ s - 1 ].x );

                    normal.copy( splineTube.normals[ s ] ).multiplyScalar( controlVert.x );
                    binormal.copy( splineTube.binormals[ s ] ).multiplyScalar( controlVert.y );

                    position2.copy( sweepPts[ s ] ).add( normal ).add( binormal );
                    v( position2.x, position2.y, position2.z );

                }

            }

        }


        // Add bevel segments planes

        //for ( b = 1; b <= bevelSegments; b ++ ) {
        for ( b = bevelSegments - 1; b >= 0; b -- ) {

            t = b / bevelSegments;
            z = bevelThickness * Math.cos( t * Math.PI / 2 );
            bs = bevelSize * Math.sin( t * Math.PI / 2 );

            // contract shape

            for ( i = 0, il = contour.length; i < il; i ++ ) {

                vert = scalePt2( contour[ i ], contourMovements[ i ], bs );
                v( vert.x, vert.y, depth + z );

            }

            // expand holes

            for ( h = 0, hl = holes.length; h < hl; h ++ ) {

                ahole = holes[ h ];
                oneHoleMovements = holesMovements[ h ];

                for ( i = 0, il = ahole.length; i < il; i ++ ) {

                    vert = scalePt2( ahole[ i ], oneHoleMovements[ i ], bs );

                    if ( ! sweepByPath ) {

                        v( vert.x, vert.y, depth + z );

                    } else {

                        v( vert.x, vert.y + sweepPts[ steps - 1 ].y, sweepPts[ steps - 1 ].x + z );

                    }

                }

            }

        }

        /* Faces */

        // Top and bottom faces

        buildLidFaces();

        // Sides faces

        buildSideFaces();


        /////  Internal functions

        function buildLidFaces() {

            var start = verticesArray.length / 3;

            if ( bevelEnabled ) {

                var layer = 0; // steps + 1
                var offset = vlen * layer;

                // Bottom faces

                for ( i = 0; i < flen; i ++ ) {

                    face = faces[ i ];
                    f3( face[ 2 ] + offset, face[ 1 ] + offset, face[ 0 ] + offset );

                }

                layer = steps + bevelSegments * 2;
                offset = vlen * layer;

                // Top faces

                for ( i = 0; i < flen; i ++ ) {

                    face = faces[ i ];
                    f3( face[ 0 ] + offset, face[ 1 ] + offset, face[ 2 ] + offset );

                }

            } else {

                // Bottom faces

                for ( i = 0; i < flen; i ++ ) {

                    face = faces[ i ];
                    f3( face[ 2 ], face[ 1 ], face[ 0 ] );

                }

                // Top faces

                for ( i = 0; i < flen; i ++ ) {

                    face = faces[ i ];
                    f3( face[ 0 ] + vlen * (steps-clipping), face[ 1 ] + vlen * (steps-clipping), face[ 2 ] + vlen * (steps-clipping) );

                }

            }

            scope.addGroup( start, verticesArray.length / 3 - start, 0 );

        }

        // Create faces for the z-sides of the shape

        function buildSideFaces() {

            var start = verticesArray.length / 3;
            var layeroffset = 0;
            sidewalls( contour, layeroffset );
            layeroffset += contour.length;

            for ( h = 0, hl = holes.length; h < hl; h ++ ) {

                ahole = holes[ h ];
                sidewalls( ahole, layeroffset );

                //, true
                layeroffset += ahole.length;

            }


            scope.addGroup( start, verticesArray.length / 3 - start, 1 );


        }

        function sidewalls( contour, layeroffset ) {

            var j, k;
            i = contour.length;

            while ( -- i >= 0 ) {

                j = i;
                k = i - 1;
                if ( k < 0 ) k = contour.length - 1;

                //console.log('b', i,j, i-1, k,vertices.length);

                var s = 0,
                    sl = steps - clipping + bevelSegments * 2;

                for ( s = 0; s < sl; s ++ ) {

                    var slen1 = vlen * s;
                    var slen2 = vlen * ( s + 1 );

                    var a = layeroffset + j + slen1,
                        b = layeroffset + k + slen1,
                        c = layeroffset + k + slen2,
                        d = layeroffset + j + slen2;

                    f4( a, b, c, d );

                }

            }

        }

        function v( x, y, z ) {

            placeholder.push( x );
            placeholder.push( y );
            placeholder.push( z );

        }


        function f3( a, b, c ) {

            addVertex( a );
            addVertex( b );
            addVertex( c );

            var nextIndex = verticesArray.length / 3;
            var uvs = uvgen.generateTopUV( scope, verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1 );

            addUV( uvs[ 0 ] );
            addUV( uvs[ 1 ] );
            addUV( uvs[ 2 ] );

        }

        function f4( a, b, c, d ) {

            addVertex( a );
            addVertex( b );
            addVertex( d );

            addVertex( b );
            addVertex( c );
            addVertex( d );


            var nextIndex = verticesArray.length / 3;
            var uvs = uvgen.generateSideWallUV( scope, verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1 );

            addUV( uvs[ 0 ] );
            addUV( uvs[ 1 ] );
            addUV( uvs[ 3 ] );

            addUV( uvs[ 1 ] );
            addUV( uvs[ 2 ] );
            addUV( uvs[ 3 ] );

        }

        function addVertex( index ) {

            verticesArray.push( placeholder[ index * 3 + 0 ] );
            verticesArray.push( placeholder[ index * 3 + 1 ] );
            verticesArray.push( placeholder[ index * 3 + 2 ] );

        }


        function addUV( vector2 ) {

            uvArray.push( vector2.x );
            uvArray.push( vector2.y );

        }

    }

}

SweepBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
SweepBufferGeometry.prototype.constructor = SweepBufferGeometry;

SweepBufferGeometry.prototype.toJSON = function () {

    var data = THREE.BufferGeometry.prototype.toJSON.call( this );

    var shapes = this.parameters.shapes;
    var options = this.parameters.options;

    return toJSON( shapes, options, data );

};

//

var WorldUVGenerator = {

    generateTopUV: function ( geometry, vertices, indexA, indexB, indexC ) {

        var a_x = vertices[ indexA * 3 ];
        var a_y = vertices[ indexA * 3 + 1 ];
        var b_x = vertices[ indexB * 3 ];
        var b_y = vertices[ indexB * 3 + 1 ];
        var c_x = vertices[ indexC * 3 ];
        var c_y = vertices[ indexC * 3 + 1 ];

        return [
            new THREE.Vector2( a_x, a_y ),
            new THREE.Vector2( b_x, b_y ),
            new THREE.Vector2( c_x, c_y )
        ];

    },

    generateSideWallUV: function ( geometry, vertices, indexA, indexB, indexC, indexD ) {

        var a_x = vertices[ indexA * 3 ];
        var a_y = vertices[ indexA * 3 + 1 ];
        var a_z = vertices[ indexA * 3 + 2 ];
        var b_x = vertices[ indexB * 3 ];
        var b_y = vertices[ indexB * 3 + 1 ];
        var b_z = vertices[ indexB * 3 + 2 ];
        var c_x = vertices[ indexC * 3 ];
        var c_y = vertices[ indexC * 3 + 1 ];
        var c_z = vertices[ indexC * 3 + 2 ];
        var d_x = vertices[ indexD * 3 ];
        var d_y = vertices[ indexD * 3 + 1 ];
        var d_z = vertices[ indexD * 3 + 2 ];

        if ( Math.abs( a_y - b_y ) < 0.01 ) {

            return [
                new THREE.Vector2( a_x, 1 - a_z ),
                new THREE.Vector2( b_x, 1 - b_z ),
                new THREE.Vector2( c_x, 1 - c_z ),
                new THREE.Vector2( d_x, 1 - d_z )
            ];

        } else {

            return [
                new THREE.Vector2( a_y, 1 - a_z ),
                new THREE.Vector2( b_y, 1 - b_z ),
                new THREE.Vector2( c_y, 1 - c_z ),
                new THREE.Vector2( d_y, 1 - d_z )
            ];

        }

    }
};

function toJSON( shapes, options, data ) {

    //

    data.shapes = [];

    if ( Array.isArray( shapes ) ) {

        for ( var i = 0, l = shapes.length; i < l; i ++ ) {

            var shape = shapes[ i ];

            data.shapes.push( shape.uuid );

        }

    } else {

        data.shapes.push( shapes.uuid );

    }

    //

    if ( options.sweepPath !== undefined ) data.options.sweepPath = options.sweepPath.toJSON();

    return data;

}
