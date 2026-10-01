import AppKit
import WebKit

// Usage: html2pdf <in.html> <out.pdf>  — prints via WebKit onto US Letter, no margins.
let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])

class Delegate: NSObject, WKNavigationDelegate {
  var window: NSWindow!
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
      let info = NSPrintInfo()
      info.paperSize = NSSize(width: 612, height: 792)
      info.topMargin = 0; info.bottomMargin = 0; info.leftMargin = 0; info.rightMargin = 0
      info.horizontalPagination = .fit
      info.verticalPagination = .automatic
      info.jobDisposition = .save
      info.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL] = output
      let op = webView.printOperation(with: info)
      op.showsPrintPanel = false
      op.showsProgressPanel = false
      op.view?.frame = NSRect(x: 0, y: 0, width: 612, height: 792)
      op.runModal(for: self.window, delegate: self, didRun: #selector(self.done(_:success:contextInfo:)), contextInfo: nil)
    }
  }
  @objc func done(_ op: NSPrintOperation, success: Bool, contextInfo: UnsafeMutableRawPointer?) {
    exit(success ? 0 : 1)
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 816, height: 1056))
let window = NSWindow(contentRect: web.frame, styleMask: [.borderless], backing: .buffered, defer: false)
window.contentView = web
let d = Delegate()
d.window = window
web.navigationDelegate = d
web.loadFileURL(input, allowingReadAccessTo: input.deletingLastPathComponent())
DispatchQueue.main.asyncAfter(deadline: .now() + 40) { exit(2) }
app.run()
