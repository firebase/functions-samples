#!/bin/sh
#
# BSD PRINT FILTER SETUP utility for Ghostscript - used and tested on
# SunOS 4.1.3, but I hope it will be useful on other BSD systems
# See documentation for usage
#

GSPATH=
while [ $# -gt 0 ]
do
    case "$1" in
	-p) GSPATH="$2"/lib/ghostscript; shift;;
        -h) echo >&2 \
            "usage: $0 [-p <gs install prefix>]\n"\
            "Where <gs install prefix> is the ""prefix""\n"\
            "for the Ghostscript install - the default is\n"\
            """/usr/local"""
            exit 1;;
	-*) echo >&2 \
	    "usage: $0 [-p <gs install prefix>]"
	    exit 1;;
	*)  break;;	# terminate while loop
    esac
    shift
done

DEVICES="bjt600.32 bjc600.32 bjc600.24 bjc600.24.3 bjc600.16 bjc600.8 bjc600.8.1 bjc600.1 bjc600.dq"
#FILTERS="if nf tf gf vf df cf rf"
FILTERS="if"

# The port your printer is on
PRINTERDEV=/dev/lp1
# The kind of printer (accepted values: 'parallel' and 'serial')
PRINTERTYPE=parallel

if [ "x$GSPATH"="x" ] ; then
  GSDIR=`which gs | awk -F / 'sub(FS $NF,x)' | awk -F / 'sub(FS $NF,x)'`/lib/ghostscript
else
  GSDIR=$GSPATH
fi

GSFILTERDIR=$GSDIR/filt
SPOOLDIR=/var/spool
GSIF=unix-lpr.sh
PCAP=printcap.insert

if [ "x$GSPATH"="x" ] ; then
  echo "Warning: Writing filters to $GSFILTERDIR"
  echo "if you do not want this, you have 10 seconds to hit ^c to abort this script:"
  for i in 10 09 08 07 06 05 04 03 02 01 continuing....; do
   sleep 1
   echo -n 
   echo -n $i
  done
  echo
fi

PATH=/bin:/usr/bin:/usr/ucb
export PATH

if [ ! -w $GSDIR ]; then
  echo "$GSDIR must be writable to create filter directory"
  exit 1
fi

echo "
Making links in the filter directory $GSFILTERDIR ...
"

#
# Make the directory for holding the filter and links
#
if [ -d $GSFILTERDIR ]; then
  echo "$GSFILTERDIR already exists - not created"
else
  mkdir $GSFILTERDIR
fi
rm -f $GSFILTERDIR/direct
ln -s . $GSFILTERDIR/direct
rm -f $GSFILTERDIR/indirect
ln -s . $GSFILTERDIR/indirect

#
# Create a link from each filtertype to the real filter script
#
for filter in $FILTERS
do
  rm -f $GSFILTERDIR/gs$filter
  ln -s  ../$GSIF $GSFILTERDIR/gs$filter
done

#
# Create a link from each device to the filter directory
#
for device in $DEVICES
do
  dualqueue=
  case "$device" in
    *.dq) device=`basename $device .dq` ; dualqueue=t ;;
  esac
  rm -f $GSFILTERDIR/$device
  if [ $dualqueue ]; then
    rm -f $GSFILTERDIR/indirect/$device
    ln -s . $GSFILTERDIR/indirect/$device
  else
    rm -f $GSFILTERDIR/direct/$device
    ln -s . $GSFILTERDIR/direct/$device
  fi
done

#
# Create a basic printcap insert - this is made in the CURRENT directory
#
rm -f $PCAP
cat > $PCAP << EOF
# This is an example printcap insert for Ghostscript printers
# You will probably want either to change the names for each printer
# below (first line for each device) to something more sensible, or
# to add additional name entries (eg cdjcolor for cdj500.24)
# The example is shown set up for $PRINTERTYPE printers - you will need
# to alter the entries for different or networked remote printer,
# eg. a remote network printer would have a line something like:
#    :lp=:rm=artemis:rp=LPT1:
# for a PC called artemis, replacing the serial port settings
#
# NB/ This is only an example - it is unlikely to be complete or exactly
# correct for your system, but is designed to illustrate filter names 
# corresponding to the accompanying bsd-if print filter
#
EOF

(
previous=undefined
for device in $DEVICES
do
  dualqueue=
  case "$device" in
    *.dq) device=`basename $device .dq` ; dualqueue=t ;;
  esac
  base="`echo $device | sed 's/\.[0-9][0-9]*$//'`"
  base="`echo $base | sed 's/\.[0-9][0-9]*$//'`"
#
# If device listed with '.dq' suffix, we set up a separate output queue
#
  if [ $dualqueue ]; then
    if [ $base != $previous ]; then
      previous=$base
      echo "\
# Entry for raw device $base.raw
$base.raw|Raw output device $base:\\
    :lp=$PRINTERDEV:\\"
    if test "$PRINTERTYPE" = serial
    then
	echo "br#19200:xc#0177777:\\"
        echo ":ms=-parity,ixon,-opost:\\"
    fi
    echo ":sd=$SPOOLDIR/$base/raw:\\
    :mx#0:sf:sh:rs:"
    fi
    echo "\
# Entry for device $device (output to $base.raw)
$device|Ghostscript device $device:\\
    :lp=/dev/null:\\"
  else
    echo "\
# Entry for device $device
$device|Ghostscript device $device:\\
    :lp=$PRINTERDEV:\\"
    if test "$PRINTERTYPE" = serial
    then
	echo "br#19200:xc#0177777:\\"
        echo ":ms=-parity,ixon,-opost:\\"
    fi
  fi
  echo "\
    :sd=$SPOOLDIR/$base:\\
    :lf=$SPOOLDIR/$base/logfile:\\
    :af=$SPOOLDIR/$base/acct:\\"
  for filter in $FILTERS
  do
    if [ $dualqueue ]; then
      echo "\
    :$filter=$GSFILTERDIR/indirect/$device/gs$filter:\\"
    else
      echo "\
    :$filter=$GSFILTERDIR/direct/$device/gs$filter:\\"
    fi
  done
  echo "\
    :mx#0:sf:sh:rs:"
done
) >> $PCAP

echo "
Example printcap insert file \"$PCAP\" now created"

#
# Remind the user what's still to do
#

echo "
NB/ You will need to create the following directories, with
appropriate permissions, and do 'touch logfile' and 'touch acct'
in the top level directories (ie. not the 'raw' ones):
"
(
for device in $DEVICES
do
  dualqueue=
  case "$device" in
    *.dq) device=`basename $device .dq` ; dualqueue=t ;;
  esac
  base="`echo $device | sed 's/\.[0-9][0-9]*$//'`"
  base="`echo $base | sed 's/\.[0-9][0-9]*$//'`"
  echo "  $SPOOLDIR/$base"
  if [ $dualqueue ]; then
    echo "  $SPOOLDIR/$base/raw"
  fi
done
) | sort -u

echo "
        + + + "
