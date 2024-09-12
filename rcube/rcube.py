import numpy as np

class State(object):
    slice_cubes = np.array([
        [[ 0, 1, 2,  3, 4, 5,  6, 7, 8],
         [ 9,10,11, 12,13,14, 15,16,17],
         [18,19,20, 21,22,23, 24,25,26]],
        [[ 0, 9,18,  1,10,19,  2,11,20],
         [ 3,12,21,  4,13,22,  5,14,23],
         [ 6,15,24,  7,16,25,  8,17,26]],
        [[ 0, 3, 6,  9,12,15, 18,21,24],
         [ 1, 4, 7, 10,13,16, 19,22,25],
         [ 2, 5, 8, 11,14,17, 20,23,26]],
        ])
    
    transitions = np.array([
        [[ 1,  2], [ 3,  4], [ 5,  6]],
        [[12,  0], [ 7, 15], [16, 10]],
        [[ 0, 12], [13,  8], [14,  9]],
        [[16,  9], [17,  0], [13,  7]],
        [[10, 14], [ 0, 17], [15,  8]],
        [[15, 13], [16, 14], [11,  0]],
        [[ 7,  8], [ 9, 10], [ 0, 11]],
        [[21,  6], [19,  1], [ 3, 22]],
        [[ 6, 21], [ 2, 18], [ 4, 23]],
        [[ 3, 23], [20,  6], [ 2, 19]],
        [[22,  4], [ 6, 20], [ 1, 18]],
        [[19, 18], [23, 22], [ 6,  5]],
        [[ 2,  1], [22, 23], [21, 20]],
        [[ 5, 20], [18,  2], [22,  3]],
        [[ 4, 22], [ 5, 21], [19,  2]],
        [[20,  5], [ 1, 19], [23,  4]],
        [[23,  3], [21,  5], [18,  1]],
        [[18, 19], [ 4,  3], [20, 21]],
        [[11, 17], [ 8, 13], [10, 16]],
        [[17, 11], [15,  7], [ 9, 14]],
        [[13, 15], [10,  9], [12, 17]],
        [[ 8,  7], [14, 16], [17, 12]],
        [[14, 10], [11, 12], [ 7, 13]],
        [[ 9, 16], [12, 11], [ 8, 15]]
        ]).transpose([1,2,0])

    perms = np.array([
        [2, 5, 8, 1, 4, 7, 0, 3, 6],
        [6, 3, 0, 7, 4, 1, 8, 5, 2]])

    codes = np.array(list(".MRB"))

    def __init__(self, other = None):
        if other is None:
            self.cube = np.arange(27)
            self.xfrm = np.zeros_like(self.cube)
        else:
            self.cube = other.cube.copy()
            self.xfrm = other.xfrm.copy()

    def __eq__(self, other):
        return np.all(self.cube == other.cube) and np.all(self.xfrm == other.xfrm)

    def __hash__(self):
        return hash((tuple(self.cube), tuple(self.xfrm)))

    def __repr__(self):
        return repr(np.vstack((self.cube.tolist(), self.xfrm.tolist())))

    def move(self, axis, slice, dir):
        sc = self.slice_cubes[axis][slice]
        tr = self.transitions[axis][dir]
        dst = type(self)(self)
        i = np.arange(9)
        j = self.perms[dir]
        di = sc[i]
        si = sc[j]
        dst.cube[di] = self.cube[si]
        dst.xfrm[di] = tr[self.xfrm[si]]
        return dst

    def moves(self, moves):
        state = self
        for axis, slice, dir in moves:
            state = state.move(axis, slice, dir)
        return state

    def summary(self, moves):
        state = self.moves(moves)
        move = state.cube != self.cube
        xfrm = state.xfrm != self.xfrm
        both = xfrm * 2 + move
        return self.codes[both.reshape((3,3,3))]

class Search(object):
    def __init__(self):
        self.levels = None
        self.states = None

    def depth(self):
        start = State()
        self.levels = 20
        self.states = set()
        self.search(start, [])

    def incremental(self):
        start = State()
        for i in xrange(20+1):
            self.levels = i
            self.states = set()
            self.search(start, [])

    def search(self, state, moves):
        if state in self.states:
            return
        self.states.add(state)

        if self.check(state, moves):
            return

        if len(moves) >= self.levels:
            return

        for axis in (0,1,2):
            for slice in (0,2):
                for dir in (0,1):
                    nstate = state.move(axis, slice, dir)
                    moves.append((axis, slice, dir))
                    self.search(nstate, moves)
                    moves.pop()

class CrossSearch(Search):
    cross = np.s_[1:9:2]
    cross_cube = np.mgrid[cross]
    cross_xfrm = np.zeros(4, dtype=int)

    def __init__(self):
        Search.__init__(self)
        self.results = None

    def depth(self):
        self.results = {}
        Search.depth(self)

    def incremental(self):
        self.results = {}
        Search.incremental(self)

    def check(self, state, moves):
        if len(self.results) >= 4*(2*9-1):
            return True

        cross_cube = state.cube[self.cross]
        cross_xfrm = state.xfrm[self.cross]
        cube = cross_cube == self.cross_cube
        xfrm = cross_xfrm == self.cross_xfrm
        kept = cube * xfrm
        if np.sum(kept) != 3:
            return False

        move = -kept
        [sc] = self.cross_cube[move]
        [dc] = cross_cube[move]
        [dx] = cross_xfrm[move]
        key = (sc, dc, dx)
        if key not in self.results:
            self.results[key] = moves[:]

        return False

class SwapSearch(CrossSearch):
    cross_cube = set(CrossSearch.cross_cube)

    def check(self, state, moves):
        cross_cube = state.cube[self.cross]
        if set(cross_cube) != self.cross_cube:
            return False

        cross_xfrm = state.xfrm[self.cross]
        if not any(cross_xfrm):
            return False

        key = (tuple(cross_cube), tuple(cross_xfrm))
        if key not in self.results:
            self.results[key] = moves[:]
            print key, moves

        return False
