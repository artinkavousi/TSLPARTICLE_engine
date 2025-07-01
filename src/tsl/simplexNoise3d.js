// Three.js Transpiler r164

import { vec4, mod, Fn, mul, sub, vec3, vec2, dot, floor, step, min, max, float, abs } from 'three/tsl';

const permute = Fn( ( [ x_immutable ] ) => {

	const x = vec4( x_immutable ).toVar();

	return mod( x.mul( 34.0 ).add( 1.0 ).mul( x ), 289.0 );

} );

const taylorInvSqrt = Fn( ( [ r_immutable ] ) => {

	const r = vec4( r_immutable ).toVar();

	return sub( 1.79284291400159, mul( 0.85373472095314, r ) );

} );

const simplexNoise3d = Fn( ( [ v_immutable ] ) => {

	const v = vec3( v_immutable ).toVar();
	const C = vec2( 1.0 / 6.0, 1.0 / 3.0 );
	const D = vec4( 0.0, 0.5, 1.0, 2.0 );
	const i = vec3( floor( v.add( dot( v, C.yyy ) ) ) ).toVar();
	const x0 = vec3( v.sub( i ).add( dot( i, C.xxx ) ) ).toVar();
	const g = vec3( step( x0.yzx, x0.xyz ) ).toVar();
	const l = vec3( sub( 1.0, g ) ).toVar();
	const i1 = vec3( min( g.xyz, l.zxy ) ).toVar();
	const i2 = vec3( max( g.xyz, l.zxy ) ).toVar();
	const x1 = vec3( x0.sub( i1 ).add( mul( 1.0, C.xxx ) ) ).toVar();
	const x2 = vec3( x0.sub( i2 ).add( mul( 2.0, C.xxx ) ) ).toVar();
	const x3 = vec3( x0.sub( 1. ).add( mul( 3.0, C.xxx ) ) ).toVar();
	i.assign( mod( i, 289.0 ) );
	// Break down complex permute calculations
	const izVec = vec4(0.0, i1.z, i2.z, 1.0);
	const iyVec = vec4(0.0, i1.y, i2.y, 1.0);
	const ixVec = vec4(0.0, i1.x, i2.x, 1.0);
	
	const izSum = i.z.add(izVec);
	const permZ = permute(izSum);
	
	const iySum = i.y.add(iyVec);
	const permZY = permute(permZ.add(iySum));
	
	const ixSum = i.x.add(ixVec);
	const permZYX = permute(permZY.add(ixSum));
	
	const p = vec4(permZYX).toVar();
	const n_ = float( 1.0 / 7.0 ).toVar();
	const ns = vec3( n_.mul( D.wyz ).sub( D.xzx ) ).toVar();
	const j = vec4( p.sub( mul( 49.0, floor( p.mul( ns.z.mul( ns.z ) ) ) ) ) ).toVar();
	const x_ = vec4( floor( j.mul( ns.z ) ) ).toVar();
	const y_ = vec4( floor( j.sub( mul( 7.0, x_ ) ) ) ).toVar();
	const x = vec4( x_.mul( ns.x ).add( ns.yyyy ) ).toVar();
	const y = vec4( y_.mul( ns.x ).add( ns.yyyy ) ).toVar();
	const h = vec4( sub( 1.0, abs( x ).sub( abs( y ) ) ) ).toVar();
	const b0 = vec4( x.xy, y.xy ).toVar();
	const b1 = vec4( x.zw, y.zw ).toVar();
	const s0 = vec4( floor( b0 ).mul( 2.0 ).add( 1.0 ) ).toVar();
	const s1 = vec4( floor( b1 ).mul( 2.0 ).add( 1.0 ) ).toVar();
	const sh = vec4( step( h, vec4( 0.0 ) ).negate() ).toVar();
	const a0 = vec4( b0.xzyw.add( s0.xzyw.mul( sh.xxyy ) ) ).toVar();
	const a1 = vec4( b1.xzyw.add( s1.xzyw.mul( sh.zzww ) ) ).toVar();
	const p0 = vec3( a0.xy, h.x ).toVar();
	const p1 = vec3( a0.zw, h.y ).toVar();
	const p2 = vec3( a1.xy, h.z ).toVar();
	const p3 = vec3( a1.zw, h.w ).toVar();
	// Break down complex norm calculation
	const dotP0 = dot(p0, p0);
	const dotP1 = dot(p1, p1);
	const dotP2 = dot(p2, p2);
	const dotP3 = dot(p3, p3);
	const dotsVec = vec4(dotP0, dotP1, dotP2, dotP3);
	const taylorResult = taylorInvSqrt(dotsVec);
	const norm = vec4(taylorResult).toVar();
	p0.mulAssign( norm.x );
	p1.mulAssign( norm.y );
	p2.mulAssign( norm.z );
	p3.mulAssign( norm.w );
	// Break down complex max calculation
	const dotX0 = dot(x0, x0);
	const dotX1 = dot(x1, x1);
	const dotX2 = dot(x2, x2);
	const dotX3 = dot(x3, x3);
	
	const dotsVec = vec4(dotX0, dotX1, dotX2, dotX3);
	const diff = sub(0.6, dotsVec);
	const maxResult = max(diff, 0.0);
	
	const m = vec4(maxResult).toVar();
	m.assign( m.mul( m ) );

	// Break down complex return statement
	const dotP0X0 = dot(p0, x0);
	const dotP1X1 = dot(p1, x1);
	const dotP2X2 = dot(p2, x2);
	const dotP3X3 = dot(p3, x3);
	
	const dotsVector = vec4(dotP0X0, dotP1X1, dotP2X2, dotP3X3);
	const mSquared = m.mul(m);
	
	const finalDot = dot(mSquared, dotsVector);
	return mul(42.0, finalDot);

} );

// layouts

permute.setLayout( {
	name: 'permute',
	type: 'vec4',
	inputs: [
		{ name: 'x', type: 'vec4' }
	]
} );

taylorInvSqrt.setLayout( {
	name: 'taylorInvSqrt',
	type: 'vec4',
	inputs: [
		{ name: 'r', type: 'vec4' }
	]
} );

simplexNoise3d.setLayout( {
	name: 'simplexNoise3d',
	type: 'float',
	inputs: [
		{ name: 'v', type: 'vec3' }
	]
} );

export { permute, taylorInvSqrt, simplexNoise3d };
