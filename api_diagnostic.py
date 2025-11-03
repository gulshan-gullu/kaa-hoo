"""
KAA HO - API Diagnostic Tool
Identify authentication and API issues
"""

import requests
import json
from datetime import datetime

class APIDiagnostic:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        
    def test_login_variations(self):
        """Test different login variations to find what works"""
        print("="*70)
        print("🔍 DIAGNOSING LOGIN API")
        print("="*70)
        
        # Try different login formats
        test_cases = [
            {
                'name': 'Standard client01',
                'url': '/api/login',
                'data': {'user_id': 'client01', 'password': 'test123'},
                'method': 'POST'
            },
            {
                'name': 'Username field',
                'url': '/api/login',
                'data': {'username': 'client01', 'password': 'test123'},
                'method': 'POST'
            },
            {
                'name': 'Email field',
                'url': '/api/login',
                'data': {'email': 'client01', 'password': 'test123'},
                'method': 'POST'
            },
            {
                'name': 'Admin user',
                'url': '/api/login',
                'data': {'user_id': 'admin01', 'password': 'test123'},
                'method': 'POST'
            },
            {
                'name': 'Empty password',
                'url': '/api/login',
                'data': {'user_id': 'client01', 'password': ''},
                'method': 'POST'
            },
        ]
        
        print("\n📝 Testing different login formats...\n")
        
        working_logins = []
        
        for test in test_cases:
            try:
                session = requests.Session()
                
                if test['method'] == 'POST':
                    r = session.post(
                        f"{self.base_url}{test['url']}",
                        json=test['data'],
                        timeout=5
                    )
                else:
                    r = session.get(
                        f"{self.base_url}{test['url']}",
                        timeout=5
                    )
                
                print(f"Test: {test['name']}")
                print(f"  Status: {r.status_code}")
                print(f"  Response: {r.text[:100]}")
                
                if r.status_code == 200:
                    print(f"  ✅ SUCCESS!")
                    working_logins.append(test)
                    
                    # Try to get cookies
                    cookies = session.cookies.get_dict()
                    if cookies:
                        print(f"  🍪 Cookies received: {list(cookies.keys())}")
                elif r.status_code == 401:
                    print(f"  ❌ Unauthorized - Wrong credentials")
                elif r.status_code == 404:
                    print(f"  ❌ Endpoint not found")
                else:
                    print(f"  ⚠️  Unexpected status")
                
                print()
                
            except Exception as e:
                print(f"Test: {test['name']}")
                print(f"  ❌ Error: {str(e)[:50]}")
                print()
        
        print("="*70)
        if working_logins:
            print(f"✅ Found {len(working_logins)} working login method(s)!")
            print("\nWorking credentials:")
            for login in working_logins:
                print(f"  • {login['name']}: {login['data']}")
        else:
            print("❌ No working login methods found!")
            print("\n💡 Suggestions:")
            print("  1. Check if server is running")
            print("  2. Verify API endpoint path")
            print("  3. Check user database has test users")
            print("  4. Review authentication requirements")
        print("="*70)
        
        return working_logins
    
    def test_api_endpoints(self):
        """Test available API endpoints"""
        print("\n" + "="*70)
        print("🔍 TESTING API ENDPOINTS")
        print("="*70)
        
        endpoints = [
            {'url': '/', 'method': 'GET', 'name': 'Home Page'},
            {'url': '/login', 'method': 'GET', 'name': 'Login Page'},
            {'url': '/api/login', 'method': 'POST', 'name': 'Login API'},
            {'url': '/api/users', 'method': 'GET', 'name': 'Users List'},
            {'url': '/api/turn-credentials', 'method': 'GET', 'name': 'TURN Credentials'},
            {'url': '/socket.io/', 'method': 'GET', 'name': 'Socket.IO'},
        ]
        
        print("\n📡 Checking endpoint accessibility...\n")
        
        for endpoint in endpoints:
            try:
                if endpoint['method'] == 'GET':
                    r = requests.get(f"{self.base_url}{endpoint['url']}", timeout=5)
                else:
                    r = requests.post(f"{self.base_url}{endpoint['url']}", 
                                     json={}, timeout=5)
                
                print(f"{endpoint['name']}")
                print(f"  URL: {endpoint['url']}")
                print(f"  Status: {r.status_code}")
                
                if r.status_code == 200:
                    print(f"  ✅ Accessible")
                elif r.status_code == 401 or r.status_code == 403:
                    print(f"  🔒 Requires authentication")
                elif r.status_code == 404:
                    print(f"  ❌ Not found")
                else:
                    print(f"  ⚠️  Status: {r.status_code}")
                
                print()
                
            except requests.ConnectionError:
                print(f"{endpoint['name']}")
                print(f"  ❌ Connection refused - Is server running?")
                print()
                break
            except Exception as e:
                print(f"{endpoint['name']}")
                print(f"  ❌ Error: {str(e)[:50]}")
                print()
    
    def test_authenticated_access(self, login_data):
        """Test accessing protected endpoints after login"""
        print("\n" + "="*70)
        print("🔒 TESTING AUTHENTICATED ACCESS")
        print("="*70)
        
        print(f"\nLogging in with: {login_data}")
        
        try:
            session = requests.Session()
            r = session.post(
                f"{self.base_url}/api/login",
                json=login_data,
                timeout=5
            )
            
            if r.status_code != 200:
                print(f"❌ Login failed: {r.status_code}")
                print(f"Response: {r.text[:200]}")
                return
            
            print(f"✅ Login successful!")
            
            # Get cookies
            cookies = session.cookies.get_dict()
            print(f"🍪 Cookies: {cookies}")
            
            # Test protected endpoints
            protected_endpoints = [
                '/api/users',
                '/api/turn-credentials',
                '/api/messages',
            ]
            
            print("\n📡 Testing protected endpoints...\n")
            
            for endpoint in protected_endpoints:
                try:
                    r = session.get(f"{self.base_url}{endpoint}", timeout=5)
                    
                    print(f"{endpoint}")
                    print(f"  Status: {r.status_code}")
                    
                    if r.status_code == 200:
                        print(f"  ✅ Accessible")
                        # Show sample of response
                        try:
                            data = r.json()
                            print(f"  Data preview: {str(data)[:100]}...")
                        except:
                            print(f"  Response: {r.text[:100]}...")
                    elif r.status_code == 401:
                        print(f"  ❌ Still unauthorized (session not working)")
                    elif r.status_code == 404:
                        print(f"  ⚠️  Endpoint doesn't exist")
                    else:
                        print(f"  ⚠️  Status: {r.status_code}")
                    
                    print()
                    
                except Exception as e:
                    print(f"{endpoint}")
                    print(f"  ❌ Error: {str(e)[:50]}")
                    print()
                    
        except Exception as e:
            print(f"❌ Error during authenticated test: {e}")
    
    def run_full_diagnostic(self):
        """Run complete diagnostic"""
        print("\n" + "="*70)
        print("🔬 KAA HO - COMPLETE API DIAGNOSTIC")
        print("="*70)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server: {self.base_url}")
        print("="*70)
        
        # Test basic connectivity
        print("\n🌐 Testing server connectivity...")
        try:
            r = requests.get(self.base_url, timeout=5)
            print(f"✅ Server is responding (Status: {r.status_code})")
        except requests.ConnectionError:
            print(f"❌ Cannot connect to server!")
            print(f"   Is the server running at {self.base_url}?")
            return
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return
        
        # Test endpoints
        self.test_api_endpoints()
        
        # Test login variations
        working_logins = self.test_login_variations()
        
        # If we found a working login, test authenticated access
        if working_logins:
            print("\n" + "="*70)
            print("🎯 TESTING WITH WORKING CREDENTIALS")
            print("="*70)
            
            # Use the first working login
            login_data = working_logins[0]['data']
            self.test_authenticated_access(login_data)
        
        # Final recommendations
        print("\n" + "="*70)
        print("💡 RECOMMENDATIONS")
        print("="*70)
        
        if working_logins:
            print("\n✅ Authentication working!")
            print("\nTo run stress tests successfully:")
            print(f"  1. Use these credentials: {working_logins[0]['data']}")
            print(f"  2. Ensure users exist in database")
            print(f"  3. Check session handling")
        else:
            print("\n❌ Authentication not working!")
            print("\nPossible issues:")
            print("  1. Database not initialized with test users")
            print("  2. Wrong API endpoint or format")
            print("  3. Server authentication disabled/broken")
            print("\nRun this to create test users:")
            print("  python init_db.py  # or similar init script")
        
        print("="*70)


if __name__ == "__main__":
    diagnostic = APIDiagnostic()
    diagnostic.run_full_diagnostic()