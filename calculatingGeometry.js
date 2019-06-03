// convert 2d points to 3d points by set z to 0
function convert2V3Array(l,b) {
    // cannot use 'for of' otherwise won't change
    for (var i=0;i<l.length;i++) {
        l[[i]] = new THREE.Vector3(l[i].x,l[i].y,b);
    }
}
// get the transform matrix of rotation on any axis
// axis: point(a,b,c), normalized direction(u,v,w)
function getRotationMatrixOnAxis(point, dir, t) {
    let a = point.x, b = point.y, c = point.z;
    let u = dir.x, v = dir.y, w = dir.z;
    let uu = u * u;
    let uv = u * v;
    let uw = u * w;
    let vv = v * v;
    let vw = v * w;
    let ww = w * w;
    let au = a * u;
    let av = a * v;
    let aw = a * w;
    let bu = b * u;
    let bv = b * v;
    let bw = b * w;
    let cu = c * u;
    let cv = c * v;
    let cw = c * w;

    let costheta = Math.cos(t);
    let sintheta = Math.sin(t);

    let m00 = uu + (vv + ww) * costheta;
    let m01 = uv * (1 - costheta) + w * sintheta;
    let m02 = uw * (1 - costheta) - v * sintheta;
    let m03 = 0;
    let m10 = uv * (1 - costheta) - w * sintheta;
    let m11 = vv + (uu + ww) * costheta;
    let m12 = vw * (1 - costheta) + u * sintheta;
    let m13 = 0;
    let m20 = uw * (1 - costheta) + v * sintheta;
    let m21 = vw * (1 - costheta) - u * sintheta;
    let m22 = ww + (uu + vv) * costheta;
    let m23 = 0;
    let m30 = (a * (vv + ww) - u * (bv + cw)) * (1 - costheta) + (bw - cv) * sintheta;
    let m31 = (b * (uu + ww) - v * (au + cw)) * (1 - costheta) + (cu - aw) * sintheta;
    let m32 = (c * (uu + vv) - w * (au + bv)) * (1 - costheta) + (av - bu) * sintheta;
    let m33 = 1;

    return new THREE.Matrix4().set(m00,m01,m02,m03,m10,m11,m12,m13,m20,m21,m22,m23,m30,m31,m32,m33);

}

/**
 * Compute distance between a point and a line segment
 * @param {THREE.Vector3} p1
 * @param {THREE.Vector3} p2
 * end points of a line segment
 * @param {THREE.Vector3} p3
 * objective point
 * @return {float}
 */
function perpendicularDistance(p1,p2,p3) {
    var a = p2.y - p1.y;
    var b = p1.x - p2.x;
    var c = p2.x * p1.y - p1.x * p2.y;
    return Math.abs( a * p3.x + b * p3.y + c / Math.sqrt( a * a + b * b ));
}

function simplifyALine(pts) {
    for (let i=0;i<pts.length-3;i++) {
        var n1 = new THREE.Vector3().subVectors(pts[i+1],pts[i]);
        var n2 = new THREE.Vector3().subVectors(pts[i+2],pts[i+1]);
    }
}

/**
 * Remove points that are too near in a polyline
 * @param {*} pts 
 * @param {*} tol 
 * @return {Array}
 */
function simplifyPoly(pts, tol) {

}

/**
 * Douglas-Peucker Reduction Algorithm
 * Reduce the points of a polyline
 * @param {Array} pts
 * @param {float} tol
 * @return {Array}
 */
function simplifyDP (pts, tol){
    var dmax = 0;
    var index = 0;
    var r = null;
    // find the point (pt) farthest from the line segment
    for (var i = 1; i <= pts.length - 2; i++){
        var d = perpendicularDistance(pts[0], pts[pts.length - 1], pts[i]);
        //console.log(d)
        if (d > dmax){
            index = i;
            dmax = d;
        }
    }
    // if pt further than tolerance, slice into 2 segments at pt and run dp separately
    if (dmax > tol){
        var r1 = simplifyDP(pts.slice(0, index),tol);
        var r2 = simplifyDP(pts.slice(index, pts.length), tol);
        r = r1.concat(r2);
    // if pt not farther than tolerance, restore 2 end points of the line segment
    } else if (pts.length > 1) {
        r = [pts[0], pts[pts.length - 1]];
    } else {
        r = [pts[0]];
    }
    return r;
}

/**
 * Compute a curve's approximate curvature at t
 * @param {THREE.CurvePath} curve
 * @param {float} t
 * @return {float}
 */
function computeCurvature(curve, t) {
    if(!curve||t>1) return;
    let n1 = curve.getTangent(t);
    let p1 = curve.getPoint(t);
    let t2 = t==1?t-1e-6:t+1e-6;
    let n2 = curve.getTangent(t2);
    let p2 = curve.getPoint(t2);
    return Math.abs(n1.angleTo(n2)/p1.distanceTo(p2));
}

/**
 * Compute a curve's approximate curvature radius at t
 * @param {THREE.CurvePath} curve
 * @param {float} t
 * @return {float}
 */
function computeCurvatureRadius(curve, t) {
    return 1/computeCurvature(curve, t);
}

/**
 * Compute a curve's min and max curvature & radius in n sampling points
 * @param {THREE.CurvePath} curve
 * @param {int} n
 * @return {float}
 */
function getCurvatureData(curve, n){
    let minKR = 1e10;
    let maxKR = 0;
    for (let t=0.01;t<0.99;t+=1/n) {
        let kr = computeCurvatureRadius(curve, t);
        minKR = kr<minKR?kr:minKR;
        maxKR = kr>maxKR?kr:maxKR;
    }
    return {curvature:{min:1/maxKR,max:1/minKR},radius:{min:minKR,max:maxKR}}
}