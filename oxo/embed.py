#!/usr/bin/env python

import sys
import xml.etree.ElementTree as etree

_escape_cdata = etree._escape_cdata

def _escape_cdata_maybe(text, encoding):
    if text[0] == '\0':
        return "<![CDATA[\n" + text[1:] + "]]>"
    return _escape_cdata(text, encoding)

etree._escape_cdata = _escape_cdata_maybe

namespaces = dict(
    dc="http://purl.org/dc/elements/1.1/",
    cc="http://creativecommons.org/ns#",
    rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    svg="http://www.w3.org/2000/svg",
    xlink="http://www.w3.org/1999/xlink")

svg = "{%s}" % (namespaces["svg"])
xlink = "{%s}" % (namespaces["xlink"])

href = xlink + "href"

def fix(node):
    if not isinstance(node.tag, str) or not node.tag.startswith(svg):
        return
    tag = node.tag[len(svg):]
    if tag == 'script':
        ref = node.get(href)
        with open(ref) as f:
            text = f.read()
        node.text = "\0" + text
        del node.attrib[href]

def walk(node, pre=None, post=None):
    if pre is not None:
        pre(node)
    for n in node:
        walk(n, pre, post)
    if post is not None:
        post(node)

def mkname(tag, prefix = "svg"):
    return "{%s}%s" % (namespaces[prefix], tag)

def fix_ns(elem):
    for k, v in elem.attrib.items():
        if not k.startswith("{"):
            del elem.attrib[k]
            elem.set(mkname(k), v)

if __name__ == '__main__':
    for k, v in namespaces.iteritems():
        etree.register_namespace(k, v)
    tree = etree.ElementTree(file=sys.stdin)
    root = tree.getroot()
    walk(root, fix)
    style = etree.Element(svg + "style")
    with open("oxo.css") as f:
        style.text = "\0" + f.read()
    root.insert(0, style)
    walk(root, fix_ns)
    tree.write(sys.stdout, encoding="UTF-8", xml_declaration=True, default_namespace=namespaces["svg"])
