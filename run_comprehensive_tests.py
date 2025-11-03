"""
KAA HO - Test Execution Script
Run comprehensive tests with detailed reporting
"""

import subprocess
import sys
from datetime import datetime

def install_dependencies():
    """Install required testing packages"""
    print("📦 Installing test dependencies...")
    packages = [
        'pytest',
        'pytest-asyncio',
        'pytest-html',
        'pytest-cov',
        'pytest-xdist',
        'httpx',
        'requests'
    ]
    
    for package in packages:
        print(f"   Installing {package}...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', package],
                      capture_output=True)
    
    print("✅ Dependencies installed!\n")

def run_tests(test_type='all'):
    """Run tests based on type"""
    
    print("="*70)
    print("🧪 KAA HO - COMPREHENSIVE TEST EXECUTION")
    print("="*70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    test_commands = {
        'all': [
            'pytest', 'test_comprehensive.py', '-v',
            '--html=test_report.html',
            '--self-contained-html'
        ],
        'auth': [
            'pytest', 'test_comprehensive.py::TestAuthentication', '-v'
        ],
        'messaging': [
            'pytest', 'test_comprehensive.py::TestMessaging', '-v'
        ],
        'calling': [
            'pytest', 'test_comprehensive.py::TestCallingInfrastructure', '-v'
        ],
        'performance': [
            'pytest', 'test_comprehensive.py::TestPerformance', '-v'
        ],
        'security': [
            'pytest', 'test_comprehensive.py::TestSecurity', '-v'
        ],
        'quick': [
            'pytest', 'test_comprehensive.py', '-v', '-x',  # Stop on first failure
            '--tb=short'  # Short traceback
        ]
    }
    
    command = test_commands.get(test_type, test_commands['all'])
    
    print(f"🎯 Running {test_type.upper()} tests...\n")
    
    try:
        result = subprocess.run(command, cwd='.')
        
        print("\n" + "="*70)
        if result.returncode == 0:
            print("✅ ALL TESTS PASSED!")
        else:
            print("⚠️  SOME TESTS FAILED - Check output above")
        print("="*70)
        
        if test_type == 'all':
            print("\n📊 Test report generated: test_report.html")
            print("   Open it in your browser to see detailed results")
        
    except FileNotFoundError:
        print("❌ Error: test_comprehensive.py not found!")
        print("   Make sure the test file is in the current directory")
    except Exception as e:
        print(f"❌ Error running tests: {e}")

def main():
    """Main execution"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║         KAA HO - COMPREHENSIVE TEST SUITE                 ║
║       Automated Testing for Your Chat & Call System       ║
╚═══════════════════════════════════════════════════════════╝

📋 Test Categories Available:
   1. Authentication Tests (login, sessions, security)
   2. Messaging Tests (send, receive, history)
   3. Calling Infrastructure (TURN, WebRTC, signaling)
   4. Performance Tests (throughput, concurrency)
   5. Security Tests (XSS, SQL injection, auth)
   6. Integration Tests (full workflows)

🎯 Test Modes:
   • all         - Run all tests (recommended)
   • quick       - Run until first failure (faster)
   • auth        - Authentication tests only
   • messaging   - Messaging tests only  
   • calling     - Calling infrastructure only
   • performance - Performance tests only
   • security    - Security tests only
    """)
    
    # Ask user what to run
    print("\nWhat would you like to do?")
    print("1. Install dependencies")
    print("2. Run ALL tests")
    print("3. Run QUICK tests (stop on first failure)")
    print("4. Run specific category")
    print("5. Exit")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == '1':
        install_dependencies()
        print("\n✅ Ready to run tests!")
        print("   Run this script again and choose option 2 or 3")
    
    elif choice == '2':
        run_tests('all')
    
    elif choice == '3':
        run_tests('quick')
    
    elif choice == '4':
        print("\nSelect category:")
        print("1. Authentication")
        print("2. Messaging")
        print("3. Calling")
        print("4. Performance")
        print("5. Security")
        
        cat_choice = input("\nEnter choice (1-5): ").strip()
        categories = {
            '1': 'auth',
            '2': 'messaging',
            '3': 'calling',
            '4': 'performance',
            '5': 'security'
        }
        
        category = categories.get(cat_choice, 'all')
        run_tests(category)
    
    elif choice == '5':
        print("\n👋 Goodbye!")
        return
    
    else:
        print("\n❌ Invalid choice!")

if __name__ == "__main__":
    main()