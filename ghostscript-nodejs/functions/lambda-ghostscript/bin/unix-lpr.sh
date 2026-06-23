#!/bin/sh
#
# Unix lpr filter. The default setup sends output directly to a pipe,
# which requires the Ghostscript process to fork, and thus may cause 
# small systems to run out of memory/swap space. An alternative strategy,
# based on a suggestion by Andy Fyfe (andy@cs.caltech.edu), uses a named
# pipe for output, which avoids the fork and can thus save a lot of memory.
#
# Unfortunately this approach can cause problems when a print job is aborted, 
# as the abort can cause one of the processes to die, leaving the process 
# at the other end of the pipe hanging forever.
#
# Because of this, the named pipe method has not been made the default,
# but it may be restored by commenting out the lines referring to
# 'gsoutput' and uncommenting the lines referring to 'gspipe'.
#

# This definition is changed on install to match the
# executable name set in the makefile
GS_EXECUTABLE=gs

PBMPLUSPATH=/usr/local/bin
PSFILTERPATH=/usr/local/lib/ghostscript
LOCALPATH=/usr/local/bin
X11HOME=/usr/X11R6

PATH=/bin:/usr/bin:/usr/ucb:/usr/etc
PATH=${PATH}\:${LOCALPATH}\:${PBMPLUSPATH}\:${PSFILTERPATH}
LD_LIBRARY_PATH=${X11HOME}/lib

export PATH LD_LIBRARY_PATH acctfile host user

user= host= acctfile=/dev/null

#
# Redirect stdout to stderr (for the logfile) and open a new channel
# connected to stdout for the raw data. This enables us to keep the
# raw data separate from programmed postscript output and error messages.
#
exec 3>&1 1>&2

#
# Get username and hostname from filter parameters
#
while [ $# != 0 ]
do  case "$1" in
  -n)	user=$2 ; shift ;;
  -h)	host=$2 ; shift ;;
  -*)	;;
  *)	acctfile=$1 ;;
  esac
  shift
done

#
# Get the filter, printer device and queue type (direct/indirect)
#
filter=`basename $0`
device=`dirname $0`
type=`dirname ${device}`
device=`basename ${device}`
fdevname=$device
type=`basename ${type}`

#
# Find the bpp and number of colors, if specified
#

colorspec="`echo ${device} | sed 's/.*\.[0-9][0-9]*\.\([0-9][0-9]*\)$/\1/'`"
if test "$colorspec" = "${device}"
then
    colorspec=""
else
    device=`basename ${device} .$colorspec`
    colorspec="-dColors=$colorspec"
fi

bpp="`echo ${device} | sed 's/.*\.\([0-9][0-9]*\)$/\1/'`"
if test "$bpp" = "${device}"
then
    bpp=1
else
    device=`basename ${device} .$bpp`
fi

#
# Information for the logfile
#
lock=`dirname ${acctfile}`/lock
cf=`sed -n '$p' ${lock}`
job=`sed -n 's/^J//p' ${cf}`
 
echo "gsbanner: ${host}:${user}  Job: ${job}  Date: `date`"
echo "gsif: ${host}:${user} ${fdevname} start - `date`"

#
# Set the direct or indirect output destinations
#
#gspipe=/tmp/gspipe.$$
#mknod ${gspipe} p

case "${type}" in
  direct)
		gsoutput="cat 1>&3" ;;
#		cat ${gspipe} 1>&3 & ;;
  indirect)
		gsoutput="lpr -P${device}.raw" ;;
#		cat ${gspipe} | lpr -P${device}.raw & ;;
esac

(
#
# Any setup required may be done here (eg. setting gamma for colour printing)
#
#echo "{0.333 exp} dup dup currenttransfer setcolortransfer"

#
# The input data is filtered here, before being passed on to Ghostscript
#
case "${filter}" in
  gsif)	  cat ;;
  gsnf)	  psdit ;;
  gstf)	  pscat ;;
  gsgf)	  psplot ;;
  gsvf)	  rasttopnm | pnmtops ;;
  gsdf)	  dvi2ps -sqlw ;;
  gscf|gsrf) echo "${filter}: filter not available" 1>&2 ; exit 0 ;;
esac

#
# This is the postlude which does the accounting
#
echo "\
(acctfile) getenv
  { currentdevice /PageCount gsgetdeviceprop dup cvi 0 gt
    { exch (a) file /acctfile exch def
      /string 20 string def
      string cvs dup length dup
      4 lt
        { 4 exch sub
          { acctfile ( ) writestring } repeat
        } { pop } ifelse
      acctfile exch writestring
      acctfile (.00 ) writestring
      acctfile (host) getenv 
        { string cvs } { (NOHOST) } ifelse writestring
      acctfile (:) writestring
      acctfile (user) getenv
        { string cvs } { (NOUSER) } ifelse writestring
      acctfile (\n) writestring
      acctfile closefile
    } { pop } ifelse
  } if
quit"
) | $GS_EXECUTABLE -q -P- -dSAFER -dNOPAUSE -sDEVICE=${device} \
		-dBitsPerPixel=${bpp} $colorspec \
		-sOutputFile=\|"${gsoutput}" -
#		-sOutputFile=${gspipe} -

rm -f ${gspipe}
#
# End the logfile entry
#
echo "gsif: end - `date`"

