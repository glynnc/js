import sys
import xml.etree.ElementTree as etree
import numpy as np

svg_ns = "{http://www.w3.org/2000/svg}"
xlink_ns = "{http://www.w3.org/1999/xlink}"
href = xlink_ns + "href"

defs = None
in_defs = False
nodes = dict()
used = set()
groups = []

def begin1(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    id = node.get("id")
    xform = node.get("transform")

    global defs, in_defs
    if tag == "defs":
        defs = node
        in_defs = True

    nodes[id] = (node, in_defs, xform)

    if tag == "use":
        link = node.get(href).lstrip("#")
        used.add(link)

def end1(node):
    global defs, in_defs
    if node == defs:
        in_defs = False

def walk(node, pre=None, post=None):
    if pre is not None:
        pre(node)
    for n in node:
        walk(n, pre, post)
    if post is not None:
        post(node)

def begin2(node):
    global next_id
    if not node.tag.startswith(svg_ns):
        return node
    id = node.get("id")
    if id in used:
        n, d, x = nodes[id]
        if n is not node:
            raise RuntimeError("inconsistency")
        if not d:
            n = etree.Element(svg_ns + "use")
            name = "nuse%d" % next_id
            n.set("id", name)
            nodes[name] = (n, False, None)
            next_id += 1
            n.set(href, "#" + id)
            if "transform" in node.attrib:
                del node.attrib["transform"]
            defs.append(node)
            return n
    return node

def walk2(node, func):
    node = func(node)
    for i, n in enumerate(node):
        nn = walk2(n, func)
        if nn is not n:
            node[i] = nn
    return node

def parse(xform):
    i0 = xform.find("(")
    i1 = xform.rfind(")")
    func = xform[:i0]
    args = map(float, xform[i0+1:i1].split(","))
    if func == "translate":
        x,y = args
        return np.matrix([[1,0,x],[0,1,y],[0,0,1]])
    elif func == "scale":
        sx,sy = args
        return np.matrix([[sx,0,0],[0,sy,0],[0,0,1]])
    elif func == "matrix":
        a,b,c,d,x,y = args
        return np.matrix([[a,b,x],[c,d,y],[0,0,1]])
    else:
        raise RuntimeError("?")

def format(m):
    (a,b,x),(c,d,y) = m.A[:2]
    if (a,b,c,d,x,y) == (1.0, 0.0, 0.0, 1.0, 0.0, 0.0):
        return None
    if (a,b,c,d) == (1.0, 0.0, 0.0, 1.0):
        return "translate(%g,%g)" % (x,y)
    elif (b,c,x,y) == (0.0, 0.0, 0.0, 0.0):
        return "scale(%g,%g)" % (a,d)
    else:
        return "matrix(%g,%g,%g,%g,%g,%g)" % (a,b,c,d,x,y)

def compose(a, b):
    if a is None:
        return b
    if b is None:
        return a
    a = parse(a)
    b = parse(b)
    return format(a * b)

def begin3(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    if tag != "use":
        return

    link = node.get(href).lstrip("#")
    n, d, x = nodes[link]
    if d:
        return
    x = compose(node.get("transform"), x)
    if x is not None:
        node.set("transform", x)

uses = dict()

def begin4(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    if tag != "use":
        return

    id = node.get("id")
    link = node.get(href)
    xform = node.get("transform")
    uses[id] = (link, xform)

def unchain():
    found = True
    while found:
        found = False
        for id, (link, xform) in uses.items():
            if link in uses:
                l_link, l_xform = uses[link]
                link = l_link
                xform = compose(xform, l_xform)
                uses[id] = link, xform
                found = True

def begin5(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    if tag != "use":
        return

    link = node.get(href)
    if link in uses:
        node.set(href, uses[link])

suits = dict((name, idx) for idx, name in enumerate(["club", "diamond", "heart", "spade"]))
cards = dict((name, idx) for idx, name in enumerate(["1","2","3","4","5","6","7","8","9","10","jack","queen","king"]))

stack = []

def begin6(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    if tag == "g":
        groups.append(node)
        id = node.get("id")
        if "_" in id:
            suit, card = id.split("_",1)
            if suit in suits and card in cards:
                dx = 202.5 * cards[card]
                dy = 315.0 * suits[suit]
                # cur = 'translate(%g,%g)' % (dx, dy)
                # xform = node.get("transform")
                # xform = compose(xform, cur)
                # if xform is None:
                #     xform = "translate(0,0)"
                # node.set("transform", xform)
                stack.append((node, 'translate(%g,%g)' % (-dx, -dy)))
                return
        elif id == "back":
            m = parse(node.get("transform"));
            dx, dy = 202.5 + m[0,2], 945 + m[1,2];
            stack.append((node, 'translate(%g,%g)' % (-dx, -dy)))
            return
    if not stack:
        return

    xform = node.get("transform")
    xform = compose(stack[-1][1], xform)
    if xform is not None:
        node.set("transform", xform)
    elif "transform" in node.attrib:
        del node.attrib["transform"]
    stack.append((node, None))

    if tag == "use":
        link = node.get(href).lstrip("#")
        if link == "rect9340":
            if xform is not None and parse(xform)[0,0] < -0.5:
                xform = compose(xform, "matrix(-1,0,0,-1,202.5,315)")
                if xform is None:
                    if "transform" in node.attrib:
                        del node.attrib["transform"]
                else:
                    node.set("transform", xform);
            print [n.get("id") for n in groups], node.get("transform")

def end6(node):
    if groups and groups[-1] == node:
        groups.pop()
    if stack and stack[-1][0] == node:
        stack.pop()

if __name__ == '__main__':
    infile, outfile = sys.argv[1], sys.argv[2]
    tree = etree.ElementTree(file=infile)
    root = tree.getroot()
    # replace chained <use>s
    walk(root, begin4)
    unchain()
    walk(root, begin5)

    # identify <use>d nodes
    walk(root, begin1, end1)

    # move <used>d nodes to <defs>
    names = sorted([k for k in nodes.iterkeys() if k.startswith("use")])
    next_id = int(names[-1][3:]) + 1
    walk2(root, begin2)

    # fix transformation of new <use>s
    walk(root, begin3)

    # remove offsets
    walk(root, begin6, end6)

    root.remove(root.find("*[@id='joker_black']"))
    root.remove(root.find("*[@id='joker_red']"))

    tree.write(outfile)
