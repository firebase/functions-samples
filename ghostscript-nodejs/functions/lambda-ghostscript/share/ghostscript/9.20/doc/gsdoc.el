;; gsdoc.el
;;
;; GNU emacs (19.34) functions to help working with the HTML form of
;; Ghostscript documentation.
;;
;; Pete Kaiser 8 September 1998 V1.2
;;		2 December 1999 V1.3	Correct improper "--" to "=="
;;					in HTML marker comments
;;============================================================
;; One global key setting, which runs the function to bind some keys
;; locally -- presumably in a buffer containing HTML code.  Plus that
;; function itself.

(global-set-key [?\C-\S-k]	'gskeys)

(defun gskeys ()

"Set the keys in this buffer to use with Ghostscript HTML docs."

(interactive)
(local-set-key [?\C-\S-b]	'gs-bold)
(local-set-key [?\C-\S-c]	'gs-code)
(local-set-key [?\C-\S-e]	'gs-emphatic)
(local-set-key [?\C-\S-g]	'gs-get-anchor)
(local-set-key [?\C-\S-h]	'gs-href)
(local-set-key [?\C-\S-i]	'gs-italic)
(local-set-key [?\C-\S-m]	'gs-mailto)
(local-set-key [?\C-\S-n]	'gs-name)
(local-set-key [?\C-\S-p]	'gs-put-anchor)
(local-set-key [?\C-\S-q]	'gs-quote)
(local-set-key [?\C-\S-r]	'gs-row-of-table)
(local-set-key [?\C-\S-s]	'gs-selfref)
(local-set-key [?\C-\S-t]	'gs-table)
(local-set-key [?\C-\S-u]	'gs-tag)
(local-set-key [?\C-\S-x]	'gs-example)
)

;;============================================================
;; Each of these next few functions just wraps a region in a
;; <TAG>...</TAG>, or two nested tags.  Where there are two, the first one
;; is inner.  See the inner function ~gsregion.

(defun gs-bold ()	"Make text strong (bold)."
(interactive)
(~gsregion "b"))

(defun gs-code ()	"Make text strong code (bold TT)."
(interactive)
(~gsregion "tt")
(~gsregion "b"))

(defun gs-emphatic ()	"Make text emphatic (bold italic)."
(interactive)
(~gsregion "em")
(~gsregion "b"))

(defun gs-italic ()	"Make text italic."
(interactive)
(~gsregion "em"))

;;============================================================

(defun gs-quote ()

"Indent a region with BLOCKQUOTE and separate it with empty lines from
surrounding text."

(interactive)

(save-restriction (narrow-to-region (region-beginning) (region-end))
    (goto-char (point-min)) (insert "\n\n")
    (push-mark (1+ (point-min)) t)
    (goto-char (point-max))
    (~gsregion "blockquote")
    (insert "\n\n")
    )
)

;;============================================================

(defun gs-example ()

"Make an indented literatim example BLOCKQUOTE PRE and separate it with
empty lines from surrounding text."

(interactive)

(save-restriction (narrow-to-region (region-beginning) (region-end))
    (goto-char (point-min)) (insert "\n")
    (push-mark (point-min) t)
    (goto-char (point-max))
    (~gsregion "pre")
    (~gsregion "blockquote")
    (insert "\n")
    )
)

;;============================================================

(defun gs-get-anchor ()

"Beginning at the head of this line, pick up the next anchor name for later
use along with its HTML file name.  This is useful when picking up an
anchor name from a file in one buffer and using it in another buffer
containing a different file."

(interactive)

;; From the beginning of this line find and pick up the next non-empty
;; anchor, which might, of course not be right here -- though that's how it
;; ought to be used, to pick up an anchor for immediate use.  The regular
;; expression picks up only the name itself.

(beginning-of-line)
(re-search-forward "<a name=\"?\\([^\">]+\\)\"?></a>" nil t)
(setq gs-anchor (buffer-substring (match-beginning 1) (match-end 1)))

;; Get the name of this buffer, treating it as the filename.

(setq gs-anchor-file (buffer-name))
)

;;============================================================

(defun gs-href ()

"Wrap a region in an empty link and leave point in the middle of the
emptiness to write the link.  Maybe some day read the URL and put it
there."

(interactive)

(save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (goto-char (point-min)) (insert "<a href=\"#\">")
  (setq HREF (- (point) 2))
  (goto-char (point-max)) (insert "</a>")
  (goto-char HREF)
  )
)

;;============================================================

(defun gs-mailto ()

"Turn an address into a proper \"mailto:\" visually bracketed with <>."

(interactive)

(save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (setq gs-address (buffer-substring (point-min) (point-max)))
  (goto-char (point-min)) (insert "&lt;<a href=\"mailto:")
  (goto-char (point-max)) (insert "\">" gs-address "</a>&gt;")
  )
)

;;============================================================

(defun gs-tag (Tag)

"Bracket a region with some arbitrary tag read from the minibuffer, leaving
point right after the opening word of the opening tag, and the end of the
region at the end of the closing tag.  Leaving point there makes it
possible, for instance, to enter additional matter in a <FONT> tag.  Get to
the end of a region with ^x-^x."

(interactive "*sTag: ")

    (~gsregion Tag)
    (exchange-point-and-mark) (forward-word 1)
)

;;============================================================

(defun gs-toc ()

"[Re]build the table of contents by picking up all the <Hn> lines and
converting them to properly indented <UL> entries, placing the TOC within
the standard TOC markers.  Note that several of the original Ghostscript
HTML files have hand-modified TOCs, so it's wise to check before running
this function.  It can be run from anywhere within the HTML file.

This function relies on the specific format of the structure comments for
the table of contents, which are set by the g~marker function used in
defvars run when this package is loaded."

(interactive)

(setq g~html-buffer (buffer-name))

(save-restriction (save-excursion
  (widen)

;; Since we're building the TOC, delete any current TOC.  Locate the place
;; for the TOC using the standard markers, deleting everything between the
;; TOC-beginning and TOC-end markers.  The new TOC is built entirely in the
;; work buffer before being copied into the HTML buffer at that point.

  (goto-char (point-min))
  (search-forward g~toc-begin nil t)
  (next-line 1) (beginning-of-line) (setq g~toc-insert (point))
  (search-forward g~toc-end nil t)
  (beginning-of-line) (delete-region g~toc-insert (point))

;; Empty the work buffer by copying nothing into it.

  (copy-to-buffer gs-work-buffer 1 1)

;; Now collect all the following header lines into a buffer to work on
;; them.  The later append-to-buffer needs point to be in the middle of the
;; empty list, so go there before entering the work buffer.

  (save-excursion (while (re-search-forward "^<h[1-6][^>]*>" nil t)
    (beginning-of-line) (setq BOH (point))
    (re-search-forward "</h[1-6]>\n" nil t)
    (append-to-buffer gs-work-buffer BOH (point))
    ))
  (goto-char g~toc-insert)

;; All the useful header lines should be in the work buffer now.

  (save-excursion
    (set-buffer gs-work-buffer)

;; Formatting as list entries: insert <ul> when the level deepens and </ul>
;; when it rises.

    (goto-char (point-min))
    (while (search-forward "</a>" nil t) (replace-match ""))
    (goto-char (point-min))
    (while (re-search-forward "</h[1-6]>" nil t) (replace-match "</a>"))
    (goto-char (point-min))
    (while (re-search-forward "<a name=\"" nil t) (replace-match "<a href=\"#"))

;; Change <h[1-6]> to <li>, inserting <ul>...</ul> as needed.  Pick up the
;; upmost level from the first header, usually <h1>, and save a copy to
;; use to insert any terminating </ul>.

    (goto-char (point-min))
    (re-search-forward "^<h\\([1-6]\\)[^>]*>" nil t)
    (setq First (string-to-number
		 (buffer-substring (match-beginning 1) (match-end 1))))
    (setq Previous First)
    (replace-match "<li>" t t)

;; Got the first one, now handle the rest.

    (while (re-search-forward "^<h\\([1-6]\\)[^>]*>" nil t)
      (setq This (string-to-number
		  (buffer-substring (match-beginning 1) (match-end 1))))
      (setq Hold This)
      (replace-match "<li>" t t) (beginning-of-line)

;; No point being too fancy with conditionals: the "while" statements here
;; make at most one logically unnecessary test.

      (while (> This Previous) (insert  "<ul>\n") (setq This (1- This)))
      (while (< This Previous) (insert "</ul>\n") (setq This (1+ This)))
      (setq Previous Hold)
      )

;; Done with the loop.  Clean up by inserting at the end any </ul> needed
;; to get back to the top level.

    (goto-char (point-max))
    (while (> Previous First) (insert "</ul>\n") (setq Previous (1- Previous)))

;; Finally add the trailing whitespace and leading whitespace and header line.

    (insert "</ul></blockquote>\n\n")
    (goto-char (point-min))
    (insert "\n<h2>Table of contents</h2>\n\n<blockquote><ul>\n")

;; The TOC is now entirely built in the work buffer.  Move it to where it's
;; supposed to be in the original buffer.

    (append-to-buffer g~html-buffer (point-min) (point-max))
    )
  ))
)

;;============================================================

(defun gs-name ()

"Insert a name anchor at point and leave point ready to enter the anchor's
name.  Anchors are always empty (that is, <a name=...></a>)."

(interactive)

(insert "<a name=\"\"></a>")
(backward-char 6)
)

;;============================================================

(defun gs-put-anchor ()

"Insert around the current region the last anchor picked up with
gs-get-anchor.  This includes the HTML file name if the href is put in a
file other than the anchor."

(interactive)

(save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (goto-char (point-min))
  (insert (concat
    "<a href=\""

;; Insert the filename (buffer name) picked up by gs-get-anchor only if
;; this is a different buffer.

    (if (string-equal gs-anchor-file (buffer-name)) "" gs-anchor-file)

;; And finish unconditionally with the specific anchor name.

    "#" gs-anchor "\">"))
  (goto-char (point-max)) (insert "</a>"))
)

;;============================================================

(defun gs-row-of-table ()

"Set up a row of a table from the line containing point.

Insert the right things at beginning and end, and in between convert tab
and \"|\" into column breaks with a nonbreaking space in between -- which
means that no entry can contain a tab or \"|\".  Format the HTML nicely
for readability.

Between each two substantive columns this function puts a column containing
a single nonbreaking space to provide a visual break.  Generally in the
first row of a table those columns should be given enough NBSPs to make
the table look right on screen and when converted to text, but this has to
be done by hand."

(interactive)

(save-restriction
  (end-of-line) (setq EOL (point))
  (beginning-of-line) (narrow-to-region (point) EOL)
  (insert "<tr valign=top>\t<td>")
  (while (re-search-forward "[|\t]" nil t)
    (replace-match "\n\t<td>&nbsp;\n\t<td>" t t))
  (goto-char (point-max))
  )
(next-line 1) (beginning-of-line)
)

;;============================================================

(defun gs-selfref ()

"Wrap an URL to make it its own link.  This is useful for links that should
be visible when converted to text."

(interactive)

(save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (goto-char (point-min))
  (if (not (looking-at "http:\\|ftp:")) (insert "http://"))
  (setq g~url (buffer-substring (point-min) (point-max)))
  (goto-char (point-min))
  (insert "<a href=\"")
  (goto-char (point-max)) (insert "\">" g~url "</a>")
  )
)

;;============================================================

(defun gs-table ()

"Set up an indented table around this region, leaving plenty of white space
around the table within the HTML.  The number of columns in the table is
hardcoded here as 3, so that number must be changed by hand if the table
has more than 3 columns.  See gs-row-of-table for how rows are built: a
table with N visible columns generally has 2N-1 HTML columns, including the
columns that provide vertical white space."

(interactive)

(save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (indent-rigidly (region-beginning) (region-end) -80)
  (goto-char (point-min))
  (insert (concat
	"\n\n<blockquote><table cellpadding=0 cellspacing=0>\n"
	"<tr><th colspan=3 bgcolor=\"#CCCC00\"><hr><font size=\"+1\">XXXXXXXXXX</font><hr>\n"
	"<tr valign=bottom>\n"
	"\t<th align=left>\n"
	"\t<td>&nbsp;&nbsp;\n"
	"\t<th align=left>\n"
	"<tr>\t<td colspan=3><hr>\n"
	))
  (goto-char (point-max))
  (insert "</table></blockquote>\n")
  )
)

;;============================================================

(defun gs-text-chars ()

"Prepare text for inclusion in HTML by converting \"&\", \"<\", and \">\"  into
their HTML special forms.  The function acts from point to end-of-region or
end-of-buffer, whichever comes first.

This function is NOT idempotent -- running it twice on the same text will
certainly do the wrong thing, unless at first the text contained none of
those characters."

(interactive)
(setq BEGIN (point))

;; Replace significant characters: "&", "<", and ">".

(while (search-forward "&" nil t) (replace-match "&amp;" t t))

(goto-char BEGIN)
(while (search-forward "<" nil t) (replace-match "&lt;" t t))

(goto-char BEGIN)
(while (search-forward ">" nil t) (replace-match "&gt;" t t))

(goto-char BEGIN)
(while (search-forward "$" nil t) (replace-match "&#36;" t t))

(goto-char BEGIN)
)

;;============================================================

(defun gs-wrap-textfile ()

"Prepare a text file for inclusion between <pre> and </pre>, then put a
header and footer around it.  One would generally run this function on a
buffer containing only an original text file; it is how the original
history and news files were first prepared.  At this point it's likely to
be most useful in preparing new sections for the news document."

(interactive)

(widen)

;; First prepare the entire text by replacing special characters.

(goto-char (point-min))
(gs-text-chars)

;; At the end of the file, end as-is text and add the standard footer.

(goto-char (point-max))
(backward-word 1) (next-line 1) (beginning-of-line)
(delete-region (point) (point-max))
(insert "\n</pre>\n")
(insert-file "Footer.htm")

;; At the beginning of the file, begin as-is text and delete everything
;; up to the identity string (if any), saving the identity string.

(goto-char (point-min))
(insert "<pre>\n") (setq g~pre-point (point))
(setq g~ID " [No pre-existing ID] ")
(if (re-search-forward (concat "^\\$" "Id:\\( [^ ]+ \\)\\$") nil t) (progn
    (setq g~ID (buffer-substring (match-beginning 1) (match-end 1)))
    (next-line 1) (beginning-of-line) (delete-region g~pre-point (point))
    ))

;; Insert the standard header and fill in the identity string.

(goto-char (point-min)) (insert-file "Header.htm")
(goto-char (point-min)) (search-forward "<!--" nil t)
(delete-horizontal-space) (insert g~ID)
(search-forward "<pre>\n" nil t)
)

;;============================================================

(defun ~gsregion (Tag)

"Tag a region, leaving point at its end and the region around the whole
thing including the new surrounding tags; thus invoking this function twice
successively makes the first invocation the inner tags and the second the
outer.

Not intended for interactive use; for that use gs-tag, which gives a little
bit of additional service."

(interactive)

(if (not (= 0 (length Tag))) (save-restriction
  (narrow-to-region (region-beginning) (region-end))
  (goto-char (point-min)) (insert "<"  Tag ">")
  (goto-char (point-max)) (insert "</" Tag ">")
  (push-mark (point-min) t)
  (goto-char (point-max))
  )
  )
)

;;============================================================

(defun gs-structure ()

"For historical interest only: add structuring commentary to a Ghostscript
HTML file.  It's crude, but it did most of the work.  Future files will
acquire their structure through plagiarism, like any other code.

Now they've all been structured, and this function was used to do it.  The
placement of table-of-contents lines never worked, because most of the
files didn't yet have TOCS.  Now all files that should have TOCs have
properly placed markers, but that's history."

(interactive)

(setq g~thisfile (buffer-name))

(widen)
(goto-char (point-min))

;; Replace the RCS $Id if one can be found in exactly the right format, and
;; otherwise insert one just after the title, along with a warning message.

(if (re-search-forward (concat "<!-- $" "Id: *\\([^ ]*\\) $ -->") nil t)
    (progn
      (setq Original (buffer-substring (match-beginning 1) (match-end 1)))
      (replace-match g~thisfile t t nil 1)
      )
    (progn
      (search-forward "</title>" nil t) (end-of-line)
      (insert (concat "\n<!-- $" "Id: " g~thisfile " $ -->"))
      (setq Original "(UNSET by gs-structure)")
      )
    )

(end-of-line)
(insert (concat "\n<!-- Originally: " Original " -->"))

;; Place the visible header marker immediately after <BODY>.

(re-search-forward "<body[^>]*>" nil t)
    (end-of-line) (forward-char 1)
    (insert (concat g~header-begin "\n\n"))

;; Place the headline marker before the first <table> block.

(search-forward "<table" nil t) (search-backward "\n\n" nil t)
    (forward-word 1) (beginning-of-line)
    (insert (concat g~headline-begin "\n\n"))

;; After the first table block place the end-headline marker and both
;; table-of-contents markers, without worrying where the table of contents
;; really is.  The TOC markers can easily be moved by hand later.

(search-forward "\n\n" nil t)
    (backward-word 1) (end-of-line) (forward-char 1)
    (insert (concat
	"\n"
	g~headline-end	"\n\n"
	g~toc-begin	"\n\n"
	g~toc-end	"\n\n"))

;; The hints section begins with the first paragraph after where the TOC
;; markers are placed, and ends with <HR>.  This isn't precise, and in fact
;; fails for several files, but once again only an approximation is needed
;; because it'll be edited by hand later.

(search-forward "<p>" nil t) (beginning-of-line)
    (insert (concat g~hint-begin "\n\n"))

(search-forward "<hr>" nil t) (beginning-of-line)
    (insert (concat g~hint-end "\n\n"))

;; The visible header ends with (and includes) the first <HR>, and the
;; contents begin immediately thereafter.

(search-forward "<hr>\n" nil t)
    (insert (concat "\n" g~header-end "\n\n"))

(forward-word 1) (beginning-of-line)
    (insert (concat g~contents-begin "\n\n"))

;; The contents end before the final <HR> and the trailer begins
;; immediately thereafter.

(goto-char (point-max)) (search-backward "<hr>" nil t)
    (backward-word 1) (end-of-line) (forward-char 1)
    (insert (concat
	"\n"
	g~contents-end	"\n\n"
	g~trailer-begin	"\n\n"))

;; The trailer ends with </BODY>.

(goto-char (point-max)) (search-backward "</body>" nil t)
    (insert (concat "\n" g~trailer-end "\n\n"))

;; We may have introduced trailing whitespace and extra empty lines.
;; Remove them.

(goto-char (point-min))
(while (re-search-forward "[ \t\240\r]+$" nil t) (replace-match "" t t))
(goto-char (point-min))
(while (re-search-forward "\n\n\n+" nil t) (replace-match "\n\n" t t))

)

;;============================================================
;; When this file is loaded into emacs, define the structure markers for GS
;; HTML files.  These markers have two purposes: first, to make the HTML
;; more readable, and second, to enable these functions to locate sections
;; unambiguously (see gs-toc, the table of contents builder).  Note that
;; the markers do not include LF.

(defun g~marker (basic)

"Build a complete Ghostscript HTML file marker from its text-only part.
gs-toc relies entirely on this function, so if it's ever changed, gs-toc
and existing markers would also have to be changed to keep pace.

Intended only for initialization, not interactive use.

All the existing files are now marked up, and since any future ones are
(properly) likely to be created by plagiarism, it's difficult to imagine
why anyone would want to change this unless they want to go to the trouble
of coming up with a much more useful marking scheme."

(interactive)

(setq HEAD (concat "<!-- [" basic "] "))
(concat HEAD
    (substring
    "====================================================================== -->"
    (- (length HEAD) 80)
    ))
)

;;============================================================
;; Initialization code that must run after functions are defined.
;;
;; Look in a Ghostscript HTML file to see how these markers are used,
;; generally
;;
;;	begin visible header
;;		begin headline
;;		end headline
;;		begin table of contents
;;		end table of contents
;;		begin hint
;;		end hint
;;	end visible header
;;	begin contents
;;	end contents
;;	begin visible trailer
;;	end visible trailer
;;
;; although the TOC is in slightly different positions in a few files.

(defvar g~header-begin		(g~marker "1.0 begin visible header")
	"Begin the HTML file's visible header material")

(defvar g~header-end		(g~marker "1.0 end visible header")
	"End the HTML file's visible header")

(defvar g~headline-begin	(g~marker "1.1 begin headline")
	"Begin the conspicuous headline")

(defvar g~headline-end		(g~marker "1.1 end headline")
	"End the conspicuous headline")

(defvar g~toc-begin		(g~marker "1.2 begin table of contents")
	"Begin the table of contents")

(defvar g~toc-end		(g~marker "1.2 end table of contents")
	"End the table of contents")

(defvar g~hint-begin		(g~marker "1.3 begin hint")
	"Begin the \"for other information\" section")

(defvar g~hint-end		(g~marker "1.3 end hint")
	"End the \"for other information\" section")

(defvar g~contents-begin	(g~marker "2.0 begin contents")
	"Begin the main contents")

(defvar g~contents-end		(g~marker "2.0 end contents")
	"End the main contents")

(defvar g~trailer-begin		(g~marker "3.0 begin visible trailer")
	"Begin the visible standard trailer material")

(defvar g~trailer-end		(g~marker "3.0 end visible trailer")
	"End the visible standard trailer material")

;;============================================================
;; Some working variables

(defvar gs-anchor	"JUNK"		"*Anchor name to insert")
(defvar gs-anchor-file	"JUNKFILE"	"*Anchor filename to insert")
(defvar gs-work-buffer	"*GS work*"	"*Ghostscript working buffer")
