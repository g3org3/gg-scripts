print("-> loading pkgs ...")
pkg = open('./package.json')
tmp = open('./.pre-package.json').read()

inDeps = False
deps = ""

print("-> reading deps ...")
for line in pkg:
    if "\"dependencies" in line:
        inDeps = True
    elif inDeps and not "}" in line:
        deps += line
    elif inDeps and "}" in line:
        inDeps = False

head = tmp[0:tmp.find('dependencies') - 4]
rest = tmp[tmp.find('}') - 1:]

pkg.close()

tmp = open('./.pre-package.json', 'w')
newPkg = head + "\n  \"dependencies\": {\n" + deps + rest

print("-> writing to pre-pkg ...")

tmp.write(newPkg)
tmp.close()

print("-> Done")
