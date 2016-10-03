PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
export PYTHONIOENCODING=utf8
LATEST_RELEASE=$(curl -s 'https://api.github.com/repos/vincelwt/harmony/releases/latest' | python -c "import sys, json; print json.load(sys.stdin)['tag_name'].replace('v', '')")

echo 'Current version is' $PACKAGE_VERSION 'and latest release is '$LATEST_RELEASE
if [ $PACKAGE_VERSION != $LATEST_RELEASE ]; then exit 0; fi

package_cloud push vince/harmony/debian/wheezy dist/harmony*.deb
package_cloud push vince/harmony/debian/jessie dist/harmony*.deb
package_cloud push vince/harmony/debian/stretch dist/harmony*.deb
package_cloud push vince/harmony/debian/buster dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/precise dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/trusty dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/utopic dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/vivid dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/wily dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/xenial dist/harmony*.deb
package_cloud push vince/harmony/ubuntu/yakkety dist/harmony*.deb
package_cloud push vince/harmony/linuxmint/qiana dist/harmony*.deb
package_cloud push vince/harmony/linuxmint/rebecca dist/harmony*.deb
package_cloud push vince/harmony/linuxmint/rafaela dist/harmony*.deb
package_cloud push vince/harmony/linuxmint/rosa dist/harmony*.deb
package_cloud push vince/harmony/linuxmint/sarah dist/harmony*.deb
package_cloud push vince/harmony/elementaryos/luna dist/harmony*.deb
package_cloud push vince/harmony/elementaryos/freya dist/harmony*.deb

package_cloud push vince/harmony/fedora/22 dist/harmony*.rpm
package_cloud push vince/harmony/fedora/24 dist/harmony*.rpm
package_cloud push vince/harmony/fedora/24 dist/harmony*.rpm