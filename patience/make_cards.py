import sys
import xml.etree.ElementTree as etree

namespaces = dict(
    dc="http://purl.org/dc/elements/1.1/",
    cc="http://creativecommons.org/ns#",
    rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    svg="http://www.w3.org/2000/svg",
    xlink="http://www.w3.org/1999/xlink")

href = "{%s}%s" % (namespaces["xlink"], "href")

points = [
    [[1, 6]],
    [[1, 0],[1,12]],
    [[1, 0],[1, 6],[1,12]],
    [[0, 0],[2, 0],[0,12],[2,12]],
    [[0, 0],[2, 0],[1, 6],[0,12],[2,12]],
    [[0, 0],[2, 0],[0, 6],[2, 6],[0,12],[2,12]],
    [[0, 0],[2, 0],[1, 3],[0, 6],[2, 6],[0,12],[2,12]],
    [[0, 0],[2, 0],[0, 4],[2, 4],[0, 8],[2, 8],[0,12],[2,12]],
    [[0, 0],[2, 0],[1, 2],[0, 4],[2, 4],[0, 8],[2, 8],[0,12],[2,12]],
    [[0, 0],[2, 0],[1, 2],[0, 4],[2, 4],[0, 8],[2, 8],[1,10],[0,12],[2,12]],
    [[0, 0],[2,12]],
    [[0, 0],[2,12]],
    [[0, 0],[2,12]]
    ]

suit_names = ["club", "diamond", "heart", "spade"]
card_names = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"]
card_labels = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

suit_colors = ["black","red","red","black",]

def mkname(tag, prefix = "svg"):
    return "{%s}%s" % (namespaces[prefix], tag)

def element(tag, prefix = "svg"):
    e = etree.Element(mkname(tag, prefix))
    # e.text = '\n'
    return e

class dims(object):
    step_x = 40
    step_y = 15
    base_x = 60
    base_y = 65
    card_x = base_x * 2 + step_x * 2
    card_y = base_y * 2 + step_y * 12
    label_x = 20
    label_y = 45
    face_x = card_x / 2
    face_y = 200
    suit_x = 20
    suit_y = 65
    space_x = card_x + 0
    space_y = card_y + 0
    border_radius = 10
    back_border = 25

    @classmethod
    def point(cls, x, y):
        return (cls.base_x + x * cls.step_x, cls.base_y + y * cls.step_y)

def make_label(card):
    label = card_labels[card]
    node = element("text")
    node.set("id", "label_%s" % label)
    node.set("class", "label")
    scale = 0.7 if len(label) > 1 else 0.9
    xform = "translate(%d,%d) scale(%.1f,1)" % (dims.label_x, dims.label_y, scale)
    node.set("transform", xform)
    node.text = label
    defs.append(node)

def make_face(card):
    label = card_labels[card]
    node = element("text")
    node.set("id", "face_%s" % label)
    node.set("class", "face")
    xform = "translate(%d,%d)" % (dims.face_x, dims.face_y)
    node.set("transform", xform)
    node.text = label
    defs.append(node)

def make_border():
    node = element("rect")
    node.set("id", "border")
    node.set("class", "border")
    node.set("rx", str(dims.border_radius))
    node.set("ry", str(dims.border_radius))
    node.set("width", str(dims.card_x))
    node.set("height", str(dims.card_y))
    defs.append(node)

def make_back():
    group = element("g")
    group.set("id", "back")
    border = element("use")
    border.set(href, "#border")
    group.append(border)

    node = element("rect")
    node.set("id", "back_rect")
    node.set("rx", str(dims.border_radius))
    node.set("ry", str(dims.border_radius))
    node.set("x", str(dims.back_border))
    node.set("y", str(dims.back_border))
    node.set("width", str(dims.card_x - 2 * dims.back_border))
    node.set("height", str(dims.card_y - 2 * dims.back_border))
    group.append(node)

    defs.append(group)

def make_defs():
    make_border()
    make_back()
    for i in xrange(13):
        make_label(i)
    for i in xrange(10,13):
        make_face(i)

def make_card(suit, card):
    suit_name = suit_names[suit]
    card_name = card_names[card]
    suit_color = suit_colors[suit]

    group = element("g")
    group.set("id", "%s_%s" % (suit_name, card_name))
    border = element("use")
    border.set(href, "#border")
    group.append(border)
    for x,y in points[card]:
        xform = "translate(%d,%d)" % dims.point(x,y)
        if y > 6:
            xform = xform + " rotate(180)"
        node = element("use")
        node.set(href, "#" + suit_name)
        node.set("transform", xform)
        group.append(node)

    label = card_labels[card]
    text = element("use")
    text.set(href, "#label_%s" % label)
    text.set("class", suit_color)
    group.append(text)

    text = element("use")
    text.set(href, "#label_%s" % label)
    text.set("class", suit_color)
    xform = "translate(%d,%d) rotate(180)" % (dims.card_x, dims.card_y)
    text.set("transform", xform)
    group.append(text)

    node = element("use")
    node.set(href, "#%s_s" % suit_name)
    xform = "translate(%d,%d)" % (dims.suit_x, dims.suit_y)
    node.set("transform", xform)
    group.append(node)

    node = element("use")
    node.set(href, "#%s_s" % suit_name)
    xform = "translate(%d,%d) rotate(180)" % (dims.card_x, dims.card_y)
    xform += " translate(%d,%d)" % (dims.suit_x, dims.suit_y)
    node.set("transform", xform)
    group.append(node)

    if card > 9:
        face = element("use")
        face.set(href, "#face_%s" % label)
        face.set("class", suit_color)
        group.append(face)
        
    return group

def make_cards():
    for suit in xrange(4):
        for card in xrange(13):
            g = make_card(suit, card)
            defs.append(g)
            u = element("use")
            u.set(href, "#" + g.get("id"))
            u.set("transform", "translate(%d,%d)" % (card * dims.space_x, suit * dims.space_y))
            root.append(u)

def fix_ns(elem):
    for k, v in elem.attrib.items():
        if not k.startswith("{"):
            del elem.attrib[k]
            elem.set(mkname(k), v)
    for child in elem:
        fix_ns(child)

if __name__ == '__main__':
    for k, v in namespaces.iteritems():
        etree.register_namespace(k, v)

    infile, outfile = sys.argv[1], sys.argv[2]
    tree = etree.ElementTree(file=infile)
    root = tree.getroot()
    defs = tree.find("*[@id='defs']")
    w = str(13 * dims.space_x)
    h = str( 4 * dims.space_y)
    root.set("viewBox", "0 0 %s %s" % (w, h))

    make_defs()
    make_cards()

    fix_ns(root)

    tree.write(outfile, default_namespace=namespaces["svg"])
