y,x = (np.mgrid[:256,:256] + 0.5) / 256
xx = x-y*2/3
xy = np.dstack((xx,y))
uvw = np.tensordot(np.array([[3,0],[0,4],[3,4]]),xy,axes=(-1,-1))
v = np.array([[[0,1,0],[-1,0,0]],[[1,0,0],[0,-1,0]],[[0,0,-1],[0,0,1]]])
d = np.tensordot(uvw,v,axes=(0,-1))
i,j,k = np.floor(uvw).astype(int)
im = d[(y*256).astype(int)%256,(x*256).astype(int)%256,(i-j)%3,(i+j+k)%2]%1
cla()
imshow(im, origin='lower')

#r2,r3,r6 = np.sqrt([2,3,6])
#m = np.matrix([[r3,-r3,0],[-1,-1,2],[r2,r2,r2]]) / r6
m = np.matrix([[0.5,-0.5,0],[-0.5,-0.5,0.5],[0.4,0.4,0.4]])
y,x = (np.mgrid[:256,:256] + 0.5) / 256 + np.array([[[0.0,0.0]]]).T
xyz = np.dstack((x,y,np.zeros_like(x)))*2
uvw = np.tensordot(xyz, m.I, axes=(-1,-1))
ijk = np.round(uvw)
delta = uvw - ijk
w = np.argmax(np.abs(delta),axis=-1)
mask = np.sum(ijk,axis=-1) != 0
iy,ix = np.ogrid[:256,:256]
ijk2 = ijk + (mask[...,None] * np.where(delta[iy,ix,w] < 0,-1,1)[...,None] * np.identity(3)[w])
xyz2 = np.tensordot(ijk2, m, axes=(-1,-1))
im = 1-np.sum((xyz-xyz2)**2,axis=-1)
gray()
cla()
#imshow(np.sum(ijk2[...]*[1,2,4],axis=-1), origin='lower')
imshow(im, origin='lower')
