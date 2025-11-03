"""
KAA HO - Calling System Debugger
Find out exactly why calls aren't working
"""

import requests
import time
from datetime import datetime

class CallingDebugger:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.issues = []
        
    def debug_step_1_ui_elements(self):
        """Check if UI elements exist"""
        print("\n" + "="*70)
        print("🔍 STEP 1: Checking UI Elements")
        print("="*70)
        
        try:
            # Login and get page
            session = requests.Session()
            r = session.post(f"{self.base_url}/api/login",
                json={'user_id': 'client01', 'password': 'test123'})
            
            if r.status_code != 200:
                print("❌ Cannot login!")
                return False
            
            # Get main page
            r = session.get(self.base_url)
            html = r.text
            
            print("\n📋 Searching for call-related UI elements...")
            
            # Check for call buttons
            call_indicators = [
                'call-btn', 'video-call-btn', 'voice-call-btn',
                'start-call', 'btn-call', 'call-button',
                'onclick="call', 'onclick="startCall'
            ]
            
            found_buttons = [ind for ind in call_indicators if ind in html]
            
            if found_buttons:
                print(f"✅ Found call button indicators:")
                for btn in found_buttons[:3]:
                    print(f"   • {btn}")
            else:
                print("❌ NO call buttons found in HTML!")
                self.issues.append("Call buttons not found in page HTML")
                
                print("\n💡 POSSIBLE CAUSES:")
                print("   1. Call buttons created dynamically by JavaScript")
                print("   2. Call buttons in a separate component")
                print("   3. Need to be in chat view to see buttons")
                
                return False
            
            # Check for video elements
            if '<video' in html:
                print(f"✅ Video elements exist in HTML")
            else:
                print("⚠️  No video elements (may be created dynamically)")
            
            # Check for calling.js
            if 'calling.js' in html:
                print(f"✅ calling.js is loaded")
            else:
                print("❌ calling.js NOT loaded!")
                self.issues.append("calling.js not included in page")
                return False
            
            return len(found_buttons) > 0
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def debug_step_2_javascript_errors(self):
        """Guide user to check JavaScript console"""
        print("\n" + "="*70)
        print("🔍 STEP 2: Check Browser Console for Errors")
        print("="*70)
        
        print("""
📋 INSTRUCTIONS:
--------------
1. Open your browser to: http://localhost
2. Login as client01 / test123
3. Press F12 to open Developer Tools
4. Click on "Console" tab
5. Look for RED error messages

COMMON ERRORS TO LOOK FOR:
---------------------------
❌ "calling.js:XX - Uncaught ReferenceError"
   → JavaScript error in calling code

❌ "Socket.IO connection failed"
   → WebSocket/Socket.IO not connecting

❌ "getUserMedia is not defined"
   → Browser doesn't support WebRTC

❌ "Permission denied"
   → Camera/microphone permissions blocked

❌ "Cannot read property 'socket' of undefined"
   → Socket.IO not initialized

❌ "Failed to load resource: net::ERR_CONNECTION_REFUSED"
   → Server connectivity issue
        """)
        
        input("\n⏸️  Press ENTER after checking console...")
        
        has_errors = input("\n❓ Do you see any RED errors in console? (yes/no): ").lower()
        
        if has_errors == 'yes':
            print("\n📝 Please share the error messages:")
            error1 = input("   Error 1: ")
            if error1:
                self.issues.append(f"Console error: {error1}")
            
            error2 = input("   Error 2 (or press ENTER if none): ")
            if error2:
                self.issues.append(f"Console error: {error2}")
            
            return False
        else:
            print("✅ No console errors - Good!")
            return True
    
    def debug_step_3_socket_connection(self):
        """Check Socket.IO connection"""
        print("\n" + "="*70)
        print("🔍 STEP 3: Socket.IO Connection Test")
        print("="*70)
        
        print("""
📋 INSTRUCTIONS:
--------------
With browser console (F12) open:

1. Look for Socket.IO connection messages
2. Should see: "Socket.IO connected" or similar

IN CONSOLE, TYPE THIS AND PRESS ENTER:
---------------------------------------
socket.connected

EXPECTED RESULTS:
-----------------
true   → Socket.IO is connected ✅
false  → Socket.IO is NOT connected ❌
undefined → Socket.IO not initialized ❌
        """)
        
        input("\n⏸️  Press ENTER after checking socket.connected...")
        
        socket_status = input("\n❓ What did 'socket.connected' return? (true/false/undefined): ").lower()
        
        if socket_status == 'true':
            print("✅ Socket.IO is connected!")
            return True
        elif socket_status == 'false':
            print("❌ Socket.IO initialized but NOT connected")
            self.issues.append("Socket.IO connection failed")
            return False
        else:
            print("❌ Socket.IO not initialized at all!")
            self.issues.append("Socket.IO not initialized (undefined)")
            return False
    
    def debug_step_4_call_buttons_visible(self):
        """Check if call buttons are actually visible"""
        print("\n" + "="*70)
        print("🔍 STEP 4: Visual Call Button Check")
        print("="*70)
        
        print("""
📋 INSTRUCTIONS:
--------------
Look at your browser window with client01 logged in.

WHERE TO LOOK FOR CALL BUTTONS:
--------------------------------
1. Next to user names in chat list (📞 or 🎥 icons)
2. In the chat header when chatting with someone
3. In a menu or toolbar
4. Hover over user names to reveal buttons

TAKE A SCREENSHOT if you can't find them!
        """)
        
        input("\n⏸️  Press ENTER when ready...")
        
        can_see_buttons = input("\n❓ Can you SEE call buttons (📞 or 🎥)? (yes/no): ").lower()
        
        if can_see_buttons == 'yes':
            print("✅ Call buttons are visible!")
            
            # Where are they?
            print("\n📍 Where are the call buttons located?")
            print("   1. Next to user names in list")
            print("   2. In chat header")
            print("   3. In a menu")
            print("   4. Other location")
            
            location = input("\n   Select (1-4): ")
            print(f"   📍 Noted: Call buttons at location {location}")
            
            return True
        else:
            print("❌ Call buttons NOT visible!")
            self.issues.append("Call buttons exist in HTML but not visible on page")
            
            print("\n💡 POSSIBLE CAUSES:")
            print("   1. CSS hiding the buttons")
            print("   2. Need to select a user first")
            print("   3. Need to be in specific view/page")
            print("   4. Buttons only shown for certain roles")
            
            return False
    
    def debug_step_5_click_test(self):
        """Test what happens when clicking call button"""
        print("\n" + "="*70)
        print("🔍 STEP 5: Call Button Click Test")
        print("="*70)
        
        print("""
📋 INSTRUCTIONS:
--------------
Now let's test what happens when you click the call button.

SETUP:
1. Browser 1: client01 logged in
2. Browser 2: admin01 logged in (Incognito)
3. Console open (F12) in BOTH browsers

EXECUTE:
1. Browser 1 (client01): Click call button for admin01
2. Watch console in BOTH browsers
3. Note what happens
        """)
        
        input("\n⏸️  Press ENTER when ready to click call button...")
        
        print("\n🎬 Click the call button NOW in Browser 1...")
        print("   Watch both consoles for messages...")
        
        input("\n⏸️  Press ENTER after clicking...")
        
        print("\n📊 WHAT HAPPENED?")
        
        anything_happened = input("\n❓ Did ANYTHING happen when you clicked? (yes/no): ").lower()
        
        if anything_happened == 'no':
            print("❌ Button click did NOTHING!")
            self.issues.append("Call button click has no effect")
            
            print("\n💡 CHECK IN CONSOLE:")
            print("   • Was there a 'call_initiate' or 'call_offer' message?")
            print("   • Any error messages?")
            print("   • Any network requests?")
            
            return False
        
        # Check what happened
        print("\n❓ What happened in Browser 1 (caller)?")
        print("   1. Modal/popup appeared")
        print("   2. 'Calling...' message shown")
        print("   3. Console message only")
        print("   4. Error message")
        print("   5. Nothing visible")
        
        browser1_result = input("\n   Select (1-5): ")
        
        print("\n❓ What happened in Browser 2 (receiver)?")
        print("   1. Incoming call popup appeared")
        print("   2. Notification shown")
        print("   3. Console message only")
        print("   4. Nothing at all")
        
        browser2_result = input("\n   Select (1-4): ")
        
        if browser2_result in ['1', '2']:
            print("✅ Incoming call WAS received!")
            return True
        else:
            print("❌ Incoming call NOT received!")
            self.issues.append("Call initiated but receiver didn't get notification")
            
            print("\n💡 POSSIBLE CAUSES:")
            print("   1. Socket.IO event not sent")
            print("   2. Socket.IO event not received")
            print("   3. Event handler not registered")
            print("   4. User ID mismatch")
            
            return False
    
    def run_full_debug(self):
        """Run complete debugging process"""
        print("\n" + "="*70)
        print("🔧 KAA HO - CALLING SYSTEM DEBUGGER")
        print("   Find out why calls aren't working")
        print("="*70)
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print("""
We will check:
  1. UI elements exist in HTML
  2. JavaScript console for errors
  3. Socket.IO connection status
  4. Call buttons are visible
  5. What happens when clicking call button

This will help us find EXACTLY what's wrong!
        """)
        
        input("\n⏸️  Press ENTER to start debugging...")
        
        # Run each debug step
        results = {}
        
        results['step1'] = self.debug_step_1_ui_elements()
        results['step2'] = self.debug_step_2_javascript_errors()
        results['step3'] = self.debug_step_3_socket_connection()
        results['step4'] = self.debug_step_4_call_buttons_visible()
        
        if results['step4']:
            results['step5'] = self.debug_step_5_click_test()
        else:
            results['step5'] = False
        
        # Print summary
        self.print_debug_summary(results)
    
    def print_debug_summary(self, results):
        """Print debugging summary"""
        print("\n" + "="*70)
        print("📊 DEBUGGING SUMMARY")
        print("="*70)
        
        steps = [
            ("UI Elements in HTML", results.get('step1', False)),
            ("No JavaScript Errors", results.get('step2', False)),
            ("Socket.IO Connected", results.get('step3', False)),
            ("Call Buttons Visible", results.get('step4', False)),
            ("Call Button Works", results.get('step5', False))
        ]
        
        print("\n✅ = Working | ❌ = Problem Found\n")
        
        for step_name, passed in steps:
            status = "✅" if passed else "❌"
            print(f"   {status} {step_name}")
        
        # Determine root cause
        print("\n" + "="*70)
        print("🔍 ROOT CAUSE ANALYSIS")
        print("="*70)
        
        if not results.get('step1'):
            print("""
❌ PRIMARY ISSUE: UI Elements Missing/Not Loaded

LIKELY CAUSES:
1. calling.js not included in HTML
2. Template not rendering call UI
3. JavaScript error preventing UI creation

SOLUTIONS:
1. Check templates/index.html includes calling.js
2. Verify calling UI HTML exists in template
3. Check browser console for JS errors
            """)
        
        elif not results.get('step2'):
            print("""
❌ PRIMARY ISSUE: JavaScript Errors

SOLUTION:
1. Fix the JavaScript errors shown in console
2. Check calling.js for syntax errors
3. Verify all dependencies loaded
            """)
        
        elif not results.get('step3'):
            print("""
❌ PRIMARY ISSUE: Socket.IO Not Connected

LIKELY CAUSES:
1. Socket.IO server not running
2. Socket.IO initialization failed
3. CORS or connection blocked

SOLUTIONS:
1. Check server logs for Socket.IO errors
2. Verify Socket.IO route in app.py
3. Check firewall/antivirus not blocking WebSocket
            """)
        
        elif not results.get('step4'):
            print("""
❌ PRIMARY ISSUE: Call Buttons Hidden

LIKELY CAUSES:
1. CSS hiding buttons (display: none)
2. Buttons only shown in certain conditions
3. Need to select a user/chat first

SOLUTIONS:
1. Check CSS for call button visibility
2. Try selecting a user in chat first
3. Check if role-based visibility (client vs admin)
            """)
        
        elif not results.get('step5'):
            print("""
❌ PRIMARY ISSUE: Call Not Transmitting

LIKELY CAUSES:
1. Socket event not emitted correctly
2. Event handler not listening
3. User ID mismatch between sender/receiver

SOLUTIONS:
1. Check calling.js for 'call_initiate' or 'call_offer' emit
2. Check Socket.IO event names match on client/server
3. Verify user IDs are correct
            """)
        
        else:
            print("""
✅ ALL CHECKS PASSED!

Your system should be working. If calls still fail:
1. Check camera/microphone permissions
2. Try different browsers
3. Check firewall/antivirus settings
4. Review WebRTC connection in console
            """)
        
        # Print all issues found
        if self.issues:
            print("\n" + "="*70)
            print("📋 ISSUES FOUND:")
            print("="*70)
            for i, issue in enumerate(self.issues, 1):
                print(f"\n{i}. {issue}")
        
        print("\n" + "="*70)
        print("🎯 NEXT STEPS:")
        print("="*70)
        print("""
1. Fix the issues identified above
2. Test again with manual call test
3. Share any error messages you see
4. Send screenshots if helpful

I'm here to help fix each issue!
        """)
        print("="*70)


if __name__ == "__main__":
    debugger = CallingDebugger()
    debugger.run_full_debug()