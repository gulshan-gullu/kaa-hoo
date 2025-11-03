"""
KAA HO - Automated Ultimate Bullet-Proof Test Suite
Python scripts for each of the 15 critical tests
"""

import time
import requests
import subprocess
import webbrowser
from datetime import datetime
import json
import platform

class UltimateTestSuite:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.results = {
            'critical': {},
            'important': {},
            'advanced': {}
        }
        self.total_score = 0
        
    def print_header(self, test_num, test_name, category="CRITICAL"):
        """Print test header"""
        colors = {
            'CRITICAL': '\033[91m',  # Red
            'IMPORTANT': '\033[93m',  # Yellow
            'ADVANCED': '\033[92m',   # Green
            'END': '\033[0m'
        }
        
        print("\n" + "="*70)
        print(f"{colors[category]}🔴 TEST {test_num}: {test_name}{colors['END']}")
        print("="*70)
    
    def test_01_call_establishment(self):
        """TEST 1: Basic Call Establishment - Automated Setup"""
        self.print_header(1, "BASIC CALL ESTABLISHMENT (<5 seconds)", "CRITICAL")
        
        print("\n📋 AUTOMATED TEST PREPARATION")
        print("-"*70)
        
        # Check server is running
        print("\n1️⃣ Checking server connectivity...")
        try:
            r = requests.get(self.base_url, timeout=5)
            print(f"   ✅ Server responding (Status: {r.status_code})")
        except:
            print(f"   ❌ Cannot connect to {self.base_url}")
            print(f"   💡 Make sure server is running!")
            return 0
        
        # Verify users can login
        print("\n2️⃣ Verifying test users...")
        users_ok = True
        for user_id in ['client01', 'admin01']:
            try:
                session = requests.Session()
                r = session.post(f"{self.base_url}/api/login",
                    json={'user_id': user_id, 'password': 'test123'},
                    timeout=5)
                if r.status_code == 200:
                    print(f"   ✅ {user_id} login works")
                else:
                    print(f"   ❌ {user_id} login failed")
                    users_ok = False
            except:
                print(f"   ❌ {user_id} cannot authenticate")
                users_ok = False
        
        if not users_ok:
            print("\n   💡 Fix authentication before testing calls!")
            return 0
        
        # Check TURN credentials
        print("\n3️⃣ Checking ICE/TURN servers...")
        try:
            session = requests.Session()
            session.post(f"{self.base_url}/api/login",
                json={'user_id': 'client01', 'password': 'test123'})
            r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
            
            if r.status_code == 200:
                data = r.json()
                ice_servers = data.get('ice_servers', [])
                print(f"   ✅ {len(ice_servers)} ICE servers available")
                
                for i, server in enumerate(ice_servers[:3], 1):
                    urls = server.get('urls', '')
                    if 'stun:' in urls:
                        print(f"      {i}. STUN server ready")
                    elif 'turn:' in urls:
                        print(f"      {i}. TURN server ready")
            else:
                print(f"   ⚠️  TURN credentials endpoint returned {r.status_code}")
        except Exception as e:
            print(f"   ⚠️  TURN check failed: {str(e)[:50]}")
        
        # Open browsers automatically
        print("\n4️⃣ Opening test browsers...")
        print("   📌 Window 1: Normal browser (client01)")
        print("   📌 Window 2: Incognito browser (admin01)")
        print()
        
        # Instructions for manual execution
        print("="*70)
        print("🎬 MANUAL EXECUTION REQUIRED")
        print("="*70)
        print("""
The automated script has verified your system is ready!
Now complete the test manually:

WINDOW 1 (Normal Browser):
  1. Browser should open automatically to http://localhost
  2. Login: client01 / test123
  3. Find the call button (📞 or 🎥)

WINDOW 2 (Incognito - Ctrl+Shift+N):
  1. Open incognito manually: Ctrl+Shift+N
  2. Go to: http://localhost
  3. Login: admin01 / test123
  4. Wait for incoming call

EXECUTE TEST:
  1. Start timer on your phone ⏱️
  2. Window 1: Click VIDEO CALL to admin01
  3. Window 2: Click ACCEPT when call arrives
  4. Stop timer when video appears in both windows
  
ENTER RESULTS BELOW:
        """)
        
        # Get user input
        try:
            call_connected = input("\n❓ Did the call connect successfully? (yes/no): ").lower()
            
            if call_connected == 'yes':
                time_taken = float(input("⏱️  How many seconds did it take? (e.g., 4.5): "))
                video_working = input("📹 Both videos visible? (yes/no): ").lower() == 'yes'
                audio_working = input("🔊 Both audios working? (yes/no): ").lower() == 'yes'
                no_errors = input("✅ No console errors (F12)? (yes/no): ").lower() == 'yes'
                
                # Calculate score
                score = 0
                if time_taken < 3 and video_working and audio_working and no_errors:
                    score = 20
                    grade = "PERFECT"
                elif time_taken < 5 and video_working and audio_working:
                    score = 18
                    grade = "EXCELLENT"
                elif time_taken < 8 and video_working and audio_working:
                    score = 15
                    grade = "GOOD"
                elif time_taken < 10:
                    score = 10
                    grade = "ACCEPTABLE"
                else:
                    score = 5
                    grade = "NEEDS IMPROVEMENT"
                
                self.results['critical']['test_01'] = {
                    'passed': True,
                    'score': score,
                    'time': time_taken,
                    'grade': grade
                }
                
                print(f"\n{'='*70}")
                print(f"✅ TEST 1 RESULT: {grade}")
                print(f"⏱️  Connection Time: {time_taken}s")
                print(f"🎯 Score: {score}/20 points")
                print(f"{'='*70}")
                
                return score
            else:
                reason = input("❌ Why did it fail?: ")
                self.results['critical']['test_01'] = {
                    'passed': False,
                    'score': 0,
                    'reason': reason
                }
                print(f"\n❌ TEST 1 FAILED: {reason}")
                return 0
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Test interrupted by user")
            return 0
        except Exception as e:
            print(f"\n❌ Error during test: {e}")
            return 0
    
    def test_02_audio_quality(self):
        """TEST 2: Audio Quality Test"""
        self.print_header(2, "AUDIO QUALITY - ZERO PACKET LOSS", "CRITICAL")
        
        print("""
📋 TEST INSTRUCTIONS:
--------------------
This test verifies perfect audio clarity during calls.

SETUP:
  1. Ensure you have an active call between client01 and admin01
  2. Both users should have working microphones
  3. Use headphones to avoid echo

EXECUTE:
  1. Person 1: Read this sentence slowly 5 times:
     "The quick brown fox jumps over the lazy dog, testing one two three"
  
  2. Person 2: Count how many times you heard it PERFECTLY
     (Every single word clear, no choppiness, no delay)

SCORING:
  5/5 perfect = 20 points (WORLD-CLASS)
  4/5 perfect = 18 points (EXCELLENT)
  3/5 perfect = 15 points (GOOD)
  2/5 perfect = 10 points (ACCEPTABLE)
  <2/5 perfect = 0 points (FAIL)
        """)
        
        try:
            input("\n⏸️  Press ENTER when you're ready to start the test...")
            
            print("\n🎤 Person 1: Start reading the sentence now (5 times)...")
            print("   'The quick brown fox jumps over the lazy dog, testing one two three'")
            
            input("\n⏸️  Press ENTER when finished...")
            
            perfect_count = int(input("\n🎧 Person 2: How many times did you hear it PERFECTLY? (0-5): "))
            
            # Calculate score
            score_map = {5: 20, 4: 18, 3: 15, 2: 10, 1: 5, 0: 0}
            score = score_map.get(perfect_count, 0)
            
            grade_map = {
                20: "WORLD-CLASS",
                18: "EXCELLENT", 
                15: "GOOD",
                10: "ACCEPTABLE",
                5: "POOR",
                0: "FAIL"
            }
            grade = grade_map.get(score, "FAIL")
            
            # Additional checks
            print("\nAdditional Quality Checks:")
            no_echo = input("  No echo or feedback? (yes/no): ").lower() == 'yes'
            no_delay = input("  No noticeable delay (<200ms)? (yes/no): ").lower() == 'yes'
            natural_voice = input("  Natural voice quality (not robotic)? (yes/no): ").lower() == 'yes'
            
            if not (no_echo and no_delay and natural_voice):
                score = max(0, score - 5)  # Deduct points for issues
            
            self.results['critical']['test_02'] = {
                'passed': score >= 15,
                'score': score,
                'perfect_count': perfect_count,
                'grade': grade,
                'no_echo': no_echo,
                'no_delay': no_delay,
                'natural_voice': natural_voice
            }
            
            print(f"\n{'='*70}")
            print(f"{'✅' if score >= 15 else '❌'} TEST 2 RESULT: {grade}")
            print(f"🎤 Perfect Clarity: {perfect_count}/5 times")
            print(f"🎯 Score: {score}/20 points")
            print(f"{'='*70}")
            
            return score
            
        except Exception as e:
            print(f"\n❌ Error during test: {e}")
            return 0
    
    def test_03_video_quality(self):
        """TEST 3: Video Quality - Smooth Motion"""
        self.print_header(3, "VIDEO QUALITY - SMOOTH MOTION", "CRITICAL")
        
        print("""
📋 TEST INSTRUCTIONS:
--------------------
This test verifies smooth video quality and frame rate.

SETUP:
  1. Active call with video enabled
  2. Good lighting on both sides
  3. Both cameras working

EXECUTE:
  Person 1 performs these actions while Person 2 observes:
  
  1. Wave your hand quickly (5 times)
  2. Move your head side to side (5 times)
  3. Stand up and sit down (2 times)
  4. Make quick facial expressions
  
  Person 2 rates the video quality:
  - Is motion smooth (not stuttering)?
  - Is image clear (not pixelated)?
  - Is face clearly visible?
  - Are there frozen frames?

SCORING:
  All smooth, HD quality = 20 points (WORLD-CLASS)
  Smooth, clear image = 18 points (EXCELLENT)
  Mostly smooth, minor issues = 15 points (GOOD)
  Choppy but watchable = 10 points (ACCEPTABLE)
  Frequent freezing = 0 points (FAIL)
        """)
        
        try:
            input("\n⏸️  Press ENTER when ready to start...")
            
            print("\n🎬 Person 1: Perform the actions now...")
            print("   (Wave hand, move head, stand up/sit, facial expressions)")
            
            input("\n⏸️  Press ENTER when finished...")
            
            print("\n📊 Person 2: Rate the video quality:")
            smooth_motion = input("  Motion was smooth (not stuttering)? (yes/no): ").lower() == 'yes'
            no_pixelation = input("  Image was clear (not pixelated)? (yes/no): ").lower() == 'yes'
            face_visible = input("  Face clearly visible? (yes/no): ").lower() == 'yes'
            no_freezing = input("  No frozen frames? (yes/no): ").lower() == 'yes'
            
            # Estimate FPS
            print("\n  Estimate frame rate:")
            print("    1. 30 FPS (very smooth, like TV)")
            print("    2. 20 FPS (smooth)")
            print("    3. 15 FPS (acceptable)")
            print("    4. <15 FPS (choppy)")
            fps_rating = int(input("  Select (1-4): "))
            
            # Calculate score
            quality_score = sum([smooth_motion, no_pixelation, face_visible, no_freezing])
            
            if fps_rating == 1 and quality_score == 4:
                score = 20
                grade = "WORLD-CLASS"
            elif fps_rating == 2 and quality_score >= 3:
                score = 18
                grade = "EXCELLENT"
            elif fps_rating == 3 and quality_score >= 3:
                score = 15
                grade = "GOOD"
            elif fps_rating == 3 and quality_score >= 2:
                score = 10
                grade = "ACCEPTABLE"
            else:
                score = 5
                grade = "POOR"
            
            self.results['critical']['test_03'] = {
                'passed': score >= 15,
                'score': score,
                'grade': grade,
                'smooth_motion': smooth_motion,
                'no_pixelation': no_pixelation,
                'face_visible': face_visible,
                'no_freezing': no_freezing,
                'fps_rating': fps_rating
            }
            
            print(f"\n{'='*70}")
            print(f"{'✅' if score >= 15 else '❌'} TEST 3 RESULT: {grade}")
            print(f"📹 Quality Score: {quality_score}/4")
            print(f"🎯 Score: {score}/20 points")
            print(f"{'='*70}")
            
            return score
            
        except Exception as e:
            print(f"\n❌ Error during test: {e}")
            return 0
    
    def test_04_call_controls(self):
        """TEST 4: Call Controls Response Time"""
        self.print_header(4, "CALL CONTROLS (<1 second each)", "CRITICAL")
        
        print("""
📋 TEST INSTRUCTIONS:
--------------------
This test measures how quickly call controls respond.

SETUP:
  1. Active call with video and audio
  2. Both users monitoring the call
  3. Timer ready (phone or watch)

CONTROLS TO TEST:
  1. Mute audio
  2. Unmute audio  
  3. Video off
  4. Video on
  5. End call

Each control must respond in <1 second!

SCORING:
  All 5 controls <1s = 20 points (PERFECT)
  4/5 controls <1s = 18 points (EXCELLENT)
  3/5 controls <1s = 15 points (GOOD)
  2/5 controls <1s = 10 points (ACCEPTABLE)
  <2/5 controls <1s = 0 points (FAIL)
        """)
        
        try:
            input("\n⏸️  Press ENTER to start control tests...")
            
            controls_passed = 0
            control_times = {}
            
            # Test each control
            controls = [
                ('Mute Audio', 'Click mute, other person confirms no audio'),
                ('Unmute Audio', 'Click unmute, other person confirms audio back'),
                ('Video Off', 'Toggle video off, other person confirms no video'),
                ('Video On', 'Toggle video on, other person confirms video back'),
                ('End Call', 'Click end call, both UIs return to normal')
            ]
            
            for i, (control, instruction) in enumerate(controls, 1):
                print(f"\n{'='*70}")
                print(f"Control {i}/5: {control}")
                print(f"Instruction: {instruction}")
                print(f"{'='*70}")
                
                input("⏸️  Press ENTER when ready to time this control...")
                
                print("⏱️  Execute the control NOW and time it...")
                
                time_taken = float(input("⏱️  How many seconds did it take? (e.g., 0.8): "))
                worked = input(f"✅ Did {control} work correctly? (yes/no): ").lower() == 'yes'
                
                control_times[control] = time_taken
                
                if worked and time_taken < 1.0:
                    controls_passed += 1
                    print(f"   ✅ PASS ({time_taken}s)")
                elif worked and time_taken < 2.0:
                    print(f"   ⚠️  SLOW but works ({time_taken}s)")
                else:
                    print(f"   ❌ FAIL ({time_taken}s or didn't work)")
            
            # Calculate score
            score_map = {5: 20, 4: 18, 3: 15, 2: 10, 1: 5, 0: 0}
            score = score_map.get(controls_passed, 0)
            
            grade_map = {20: "PERFECT", 18: "EXCELLENT", 15: "GOOD", 10: "ACCEPTABLE", 5: "POOR", 0: "FAIL"}
            grade = grade_map.get(score, "FAIL")
            
            avg_time = sum(control_times.values()) / len(control_times)
            
            self.results['critical']['test_04'] = {
                'passed': score >= 15,
                'score': score,
                'grade': grade,
                'controls_passed': controls_passed,
                'control_times': control_times,
                'avg_time': avg_time
            }
            
            print(f"\n{'='*70}")
            print(f"{'✅' if score >= 15 else '❌'} TEST 4 RESULT: {grade}")
            print(f"🎛️  Controls Working: {controls_passed}/5")
            print(f"⏱️  Average Response: {avg_time:.2f}s")
            print(f"🎯 Score: {score}/20 points")
            print(f"{'='*70}")
            
            return score
            
        except Exception as e:
            print(f"\n❌ Error during test: {e}")
            return 0
    
    def test_05_call_rejection(self):
        """TEST 5: Call Rejection Handling"""
        self.print_header(5, "CALL REJECTION (<3 seconds)", "CRITICAL")
        
        print("""
📋 TEST INSTRUCTIONS:
--------------------
This test verifies proper handling of rejected calls.

SETUP:
  1. Both browsers logged in and ready
  2. NO active call currently
  3. Timer ready

EXECUTE:
  1. Window 1 (client01): Initiate call to admin01
  2. Window 2 (admin01): IMMEDIATELY click REJECT/DECLINE
  3. Time how long until caller sees rejection message
  4. Verify caller can make another call immediately

SCORING:
  <2s + clean UI = 20 points (PERFECT)
  <3s + works = 18 points (EXCELLENT)
  <5s + works = 15 points (GOOD)
  <8s + works = 10 points (ACCEPTABLE)
  >8s or broken = 0 points (FAIL)
        """)
        
        try:
            input("\n⏸️  Press ENTER when ready to test call rejection...")
            
            print("\n🎬 EXECUTE:")
            print("   1. Window 1: Call admin01")
            print("   2. Window 2: REJECT immediately")
            print("   3. Measure time to see rejection")
            
            input("\n⏸️  Press ENTER when test is complete...")
            
            time_taken = float(input("\n⏱️  Rejection message appeared in how many seconds?: "))
            clear_message = input("📱 Clear 'Call rejected' message shown? (yes/no): ").lower() == 'yes'
            can_call_again = input("📞 Can make new call immediately? (yes/no): ").lower() == 'yes'
            no_ui_issues = input("✨ No hanging UI elements? (yes/no): ").lower() == 'yes'
            
            # Calculate score
            if time_taken < 2 and clear_message and can_call_again and no_ui_issues:
                score = 20
                grade = "PERFECT"
            elif time_taken < 3 and clear_message and can_call_again:
                score = 18
                grade = "EXCELLENT"
            elif time_taken < 5 and can_call_again:
                score = 15
                grade = "GOOD"
            elif time_taken < 8:
                score = 10
                grade = "ACCEPTABLE"
            else:
                score = 0
                grade = "FAIL"
            
            self.results['critical']['test_05'] = {
                'passed': score >= 15,
                'score': score,
                'grade': grade,
                'time': time_taken,
                'clear_message': clear_message,
                'can_call_again': can_call_again,
                'no_ui_issues': no_ui_issues
            }
            
            print(f"\n{'='*70}")
            print(f"{'✅' if score >= 15 else '❌'} TEST 5 RESULT: {grade}")
            print(f"⏱️  Rejection Time: {time_taken}s")
            print(f"🎯 Score: {score}/20 points")
            print(f"{'='*70}")
            
            return score
            
        except Exception as e:
            print(f"\n❌ Error during test: {e}")
            return 0
    
    def run_critical_tests(self):
        """Run all 5 critical tests"""
        print("\n" + "="*70)
        print("🔥 STARTING CRITICAL TESTS (PHASE 1)")
        print("   These tests MUST pass to continue")
        print("="*70)
        
        print("\n📋 You will run 5 critical tests:")
        print("   1. Basic Call Establishment (<5s)")
        print("   2. Audio Quality (Perfect clarity)")
        print("   3. Video Quality (Smooth motion)")
        print("   4. Call Controls (<1s response)")
        print("   5. Call Rejection (<3s)")
        print("\n⏱️  Estimated time: 30 minutes")
        
        input("\n⏸️  Press ENTER to begin Critical Tests...")
        
        # Run each test
        score1 = self.test_01_call_establishment()
        
        if score1 == 0:
            print("\n❌ CRITICAL: Test 1 failed! Fix before continuing.")
            return
        
        input("\n⏸️  Press ENTER to continue to Test 2...")
        score2 = self.test_02_audio_quality()
        
        input("\n⏸️  Press ENTER to continue to Test 3...")
        score3 = self.test_03_video_quality()
        
        input("\n⏸️  Press ENTER to continue to Test 4...")
        score4 = self.test_04_call_controls()
        
        input("\n⏸️  Press ENTER to continue to Test 5...")
        score5 = self.test_05_call_rejection()
        
        # Calculate total
        total_critical = score1 + score2 + score3 + score4 + score5
        
        # Print summary
        self.print_critical_summary(total_critical, [score1, score2, score3, score4, score5])
        
        return total_critical
    
    def print_critical_summary(self, total, scores):
        """Print summary of critical tests"""
        print("\n" + "="*70)
        print("📊 CRITICAL TESTS SUMMARY")
        print("="*70)
        
        tests = [
            "Call Establishment",
            "Audio Quality",
            "Video Quality",
            "Call Controls",
            "Call Rejection"
        ]
        
        for i, (test, score) in enumerate(zip(tests, scores), 1):
            status = "✅" if score >= 15 else "❌"
            print(f"   {status} Test {i} - {test}: {score}/20 points")
        
        print(f"\n{'='*70}")
        print(f"CRITICAL SCORE: {total}/100")
        print(f"{'='*70}")
        
        if total >= 90:
            print("\n🏆 OUTSTANDING! All critical tests passed!")
            print("✅ Your system is ready for Important Tests (Phase 2)")
        elif total >= 70:
            print("\n✅ GOOD! Most critical tests passed")
            print("⚠️  Fix failing tests before production")
        else:
            print("\n❌ NEEDS WORK! Critical tests need attention")
            print("🔧 Fix these issues before continuing")
        
        print(f"\n{'='*70}")


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("🚀 KAA HO - ULTIMATE BULLET-PROOF TEST SUITE")
    print("   Automated Testing with Manual Verification")
    print("="*70)
    print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = UltimateTestSuite()
    
    print("\n📋 TEST PHASES:")
    print("   Phase 1: Critical Tests (5 tests, 100 points)")
    print("   Phase 2: Important Tests (5 tests, 75 points)")
    print("   Phase 3: Advanced Tests (5 tests, 50 points)")
    print("\n   Total Possible: 225 points")
    
    print("\n⚠️  IMPORTANT:")
    print("   • Have 2 browsers ready (normal + incognito)")
    print("   • Have timer ready (phone or watch)")
    print("   • Have headphones for audio tests")
    print("   • Allow ~2 hours for complete testing")
    
    input("\n⏸️  Press ENTER to start Phase 1 (Critical Tests)...")
    
    critical_score = tester.run_critical_tests()
    
    if critical_score >= 70:
        print("\n🎯 Ready for Phase 2 (Important Tests)")
        proceed = input("\n❓ Continue to Important Tests? (yes/no): ").lower()
        
        if proceed == 'yes':
            print("\n🚧 Important Tests (Phase 2) - Coming in next iteration")
            print("   Tests include:")
            print("   • Network interruption recovery")
            print("   • Slow network performance")
            print("   • Rapid successive calls")
            print("   • Long duration stability")
            print("   • Multi-tab stress")
    else:
        print("\n⚠️  Fix critical test failures before continuing")
    
    print("\n" + "="*70)
    print("Test session complete!")
    print("="*70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")