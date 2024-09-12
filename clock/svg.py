import sys
import xml.etree.ElementTree as etree

svg_ns = '{http://www.w3.org/2000/svg}'

digit = None
segment = 0

def fix(node):
    if not node.tag.startswith(svg_ns):
        return
    tag = node.tag[len(svg_ns):]
    global digit, segment
    if tag == 'g':
        id = node.get("id")
        if id.startswith("digit_"):
            digit = id
            segment = 0
    elif tag == 'path':
        id = digit + "_" + str(segment)
        segment += 1
        node.set("id", id)

def walk(node, pre=None, post=None):
    if pre is not None:
        pre(node)
    for n in node:
        walk(n, pre, post)
    if post is not None:
        post(node)

if __name__ == '__main__':
    filename = sys.argv[1]
    tree = etree.ElementTree(file=filename)
    walk(tree.getroot(), fix)
    tree.write(filename)
