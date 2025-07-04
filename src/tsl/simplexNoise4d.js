// Three.js Transpiler r164

import { vec4, mod, Fn, float, floor, overloadingFn, mul, sub, vec3, fract, abs, dot, vec2, step, clamp, max, If, select } from 'three/tsl';

const permute_0 = Fn( ( [ x_immutable ] ) => {

	const x = vec4( x_immutable ).toVar();

	return mod( x.mul( 34.0 ).add( 1.0 ).mul( x ), 289.0 );

} );

const permute_1 = Fn( ( [ x_immutable ] ) => {

	const x = float( x_immutable ).toVar();

	return floor( mod( x.mul( 34.0 ).add( 1.0 ).mul( x ), 289.0 ) );

} );

const permute = overloadingFn( [ permute_0, permute_1 ] );

const taylorInvSqrt_0 = Fn( ( [ r_immutable ] ) => {

	const r = vec4( r_immutable ).toVar();

	return sub( 1.79284291400159, mul( 0.85373472095314, r ) );

} );

const taylorInvSqrt_1 = Fn( ( [ r_immutable ] ) => {

	const r = float( r_immutable ).toVar();

	return sub( 1.79284291400159, mul( 0.85373472095314, r ) );

} );

const taylorInvSqrt = overloadingFn( [ taylorInvSqrt_0, taylorInvSqrt_1 ] );

const grad4 = Fn( ( [ j_immutable, ip_immutable ] ) => {

	const ip = vec4( ip_immutable ).toVar();
	const j = float( j_immutable ).toVar();
	const ones = vec4( 1.0, 1.0, 1.0, - 1.0 );
	const p = vec4().toVar();
	const s = vec4().toVar();
	p.xyz.assign( floor( fract( vec3( j ).mul( ip.xyz ) ).mul( 7.0 ) ).mul( ip.z ).sub( 1.0 ) );
	p.w.assign( sub( 1.5, dot( abs( p.xyz ), ones.xyz ) ) );

	// Replace lessThanAssign with explicit boolean-to-float conversion
	const cmpX = p.x.lessThan( 0.0 );
	const cmpY = p.y.lessThan( 0.0 );
	const cmpZ = p.z.lessThan( 0.0 );
	const cmpW = p.w.lessThan( 0.0 );

	s.x.assign( select( cmpX, 1, 0 ) );
	s.y.assign( select( cmpY, 1, 0 ) );
	s.z.assign( select( cmpZ, 1, 0 ) );
	s.w.assign( select( cmpW, 1, 0 ) );

	p.xyz.assign( p.xyz.add( s.xyz.mul( 2.0 ).sub( 1.0 ).mul( s.www ) ) );

	return p;

} );

const simplexNoise4d = Fn( ( [ v_immutable ] ) => {

	const v = vec4( v_immutable ).toVar();
	const C = vec2( 0.138196601125010504, 0.309016994374947451 );
	const i = vec4( floor( v.add( dot( v, C.yyyy ) ) ) ).toVar();
	const x0 = vec4( v.sub( i ).add( dot( i, C.xxxx ) ) ).toVar();
	const i0 = vec4().toVar();
	const isX = vec3( step( x0.yzw, x0.xxx ) ).toVar();
	const isYZ = vec3( step( x0.zww, x0.yyz ) ).toVar();
	// Break down complex expressions to avoid parameter length limits
	const isXSum = isX.x.add(isX.y)
	i0.x.assign( isXSum.add( isX.z ) );
	i0.yzw.assign( sub( 1.0, isX ) );
	
	const isYZSum = isYZ.x.add( isYZ.y )
	i0.y.addAssign( isYZSum );
	
	const oneMinusIsYZ = sub( 1.0, isYZ.xy )
	i0.zw.addAssign( oneMinusIsYZ );
	
	i0.z.addAssign( isYZ.z );
	const oneMinusIsYZz = sub( 1.0, isYZ.z )
	i0.w.addAssign( oneMinusIsYZz );
	const i3 = vec4( clamp( i0, 0.0, 1.0 ) ).toVar();
	const i2 = vec4( clamp( i0.sub( 1.0 ), 0.0, 1.0 ) ).toVar();
	const i1 = vec4( clamp( i0.sub( 2.0 ), 0.0, 1.0 ) ).toVar();
	const x1 = vec4( x0.sub( i1 ).add( mul( 1.0, C.xxxx ) ) ).toVar();
	const x2 = vec4( x0.sub( i2 ).add( mul( 2.0, C.xxxx ) ) ).toVar();
	const x3 = vec4( x0.sub( i3 ).add( mul( 3.0, C.xxxx ) ) ).toVar();
	const x4 = vec4( x0.sub( 1.0 ).add( mul( 4.0, C.xxxx ) ) ).toVar();
	i.assign( mod( i, 289.0 ) );
	// Break down nested permute calls
	const permW = permute( i.w )
	const permWZ = permute( permW.add( i.z ) )
	const permWZY = permute( permWZ.add( i.y ) )
	const permWZYX = permute( permWZY.add( i.x ) )
	const j0 = float( permWZYX ).toVar();
	// Break down the complex nested j1 calculation
	const iWVec = vec4( i1.w, i2.w, i3.w, 1.0 );
	const iZVec = vec4( i1.z, i2.z, i3.z, 1.0 );
	const iYVec = vec4( i1.y, i2.y, i3.y, 1.0 );
	const iXVec = vec4( i1.x, i2.x, i3.x, 1.0 );
	
	const wComp = i.w.add(iWVec);
	const zComp = i.z.add(iZVec);
	const yComp = i.y.add(iYVec);
	const xComp = i.x.add(iXVec);
	
	const perm1 = permute(wComp);
	const perm2 = permute(perm1.add(zComp));
	const perm3 = permute(perm2.add(yComp));
	const perm4 = permute(perm3.add(xComp));
	
	const j1 = vec4(perm4).toVar();
	const ip = vec4( 1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0 ).toVar();
	const p0 = vec4( grad4( j0, ip ) ).toVar();
	const p1 = vec4( grad4( j1.x, ip ) ).toVar();
	const p2 = vec4( grad4( j1.y, ip ) ).toVar();
	const p3 = vec4( grad4( j1.z, ip ) ).toVar();
	const p4 = vec4( grad4( j1.w, ip ) ).toVar();
	// Break down norm calculation
	const dotP0 = dot(p0, p0);
	const dotP1 = dot(p1, p1);
	const dotP2 = dot(p2, p2);
	const dotP3 = dot(p3, p3);
	const dotVec = vec4(dotP0, dotP1, dotP2, dotP3);
	const taylorResult = taylorInvSqrt(dotVec);
	const norm = vec4(taylorResult).toVar();
	p0.mulAssign( norm.x );
	p1.mulAssign( norm.y );
	p2.mulAssign( norm.z );
	p3.mulAssign( norm.w );
	p4.mulAssign( taylorInvSqrt( dot( p4, p4 ) ) );
	const m0 = vec3( max( sub( 0.6, vec3( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ) ) ), 0.0 ) ).toVar();
	const m1 = vec2( max( sub( 0.6, vec2( dot( x3, x3 ), dot( x4, x4 ) ) ), 0.0 ) ).toVar();
	m0.assign( m0.mul( m0 ) );
	m1.assign( m1.mul( m1 ) );

	// Break down complex return statement
	const dotP0X0 = dot(p0, x0);
	const dotP1X1 = dot(p1, x1);
	const dotP2X2 = dot(p2, x2);
	const dotP3X3 = dot(p3, x3);
	const dotP4X4 = dot(p4, x4);
	
	const m0Squared = m0.mul(m0);
	const m1Squared = m1.mul(m1);
	
	const vec3Dots = vec3(dotP0X0, dotP1X1, dotP2X2);
	const vec2Dots = vec2(dotP3X3, dotP4X4);
	
	const dotPart1 = dot(m0Squared, vec3Dots);
	const dotPart2 = dot(m1Squared, vec2Dots);
	
	const sumDots = dotPart1.add(dotPart2);
	return mul(49.0, sumDots);

} );

// layouts

permute_0.setLayout( {
	name: 'permute_0',
	type: 'vec4',
	inputs: [
		{ name: 'x', type: 'vec4' }
	]
} );

permute_1.setLayout( {
	name: 'permute_1',
	type: 'float',
	inputs: [
		{ name: 'x', type: 'float' }
	]
} );

taylorInvSqrt_0.setLayout( {
	name: 'taylorInvSqrt_0',
	type: 'vec4',
	inputs: [
		{ name: 'r', type: 'vec4' }
	]
} );

taylorInvSqrt_1.setLayout( {
	name: 'taylorInvSqrt_1',
	type: 'float',
	inputs: [
		{ name: 'r', type: 'float' }
	]
} );

grad4.setLayout( {
	name: 'grad4',
	type: 'vec4',
	inputs: [
		{ name: 'j', type: 'float' },
		{ name: 'ip', type: 'vec4' }
	]
} );

simplexNoise4d.setLayout( {
	name: 'simplexNoise4d',
	type: 'float',
	inputs: [
		{ name: 'v', type: 'vec4' }
	]
} );

export { permute, taylorInvSqrt, grad4, simplexNoise4d };
