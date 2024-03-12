echo 'Removing old artifacts from out/chrome ...'
rm -rf ./out/chrome;
echo 'Creating directory out/chrome ...'
mkdir ./out/chrome;
echo 'Copying new artifacts ...'
cp -r ./build ./out/chrome;
echo 'Fixing filenames ...'
cd ./out/chrome/build;
find . -name '*.js' -exec sed -i -e 's/_next/next/g' {} \;
find . -name '*.html' -exec sed -i -e 's/_next/next/g' {} \;
mv ./_next ./next;

# sed -i '' -e 's/\\/_next/\\.\\/next/g' out/**.html
