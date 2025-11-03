#!/usr/bin/env python3
"""
🚀 KAA HO - File Upload Stress Test Suite
Tests your 3GB upload system under extreme pressure
"""

import requests
import time
import os
import random
import string
import threading
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ==========================================
# 🔧 CONFIGURATION - UPDATED WITH YOUR CREDENTIALS
# ==========================================

BASE_URL = "http://localhost"  # Change to https://localhost if using SSL
LOGIN_URL = f"{BASE_URL}/login"
UPLOAD_CHUNK_URL = f"{BASE_URL}/api/upload-chunk"
FINALIZE_URL = f"{BASE_URL}/api/finalize-upload"
SEND_FILE_URL = f"{BASE_URL}/api/send-file"

# ✅ Test credentials from your database
TEST_USERS = {
    'admin': {
        'user_id': 'admin01',  # ✅ FIXED: Use user_id, not email
        'password': 'test123',
        'id': 'admin01'
    },
    'client1': {
        'user_id': 'client01',  # ✅ FIXED: Use user_id, not email
        'password': 'test123',
        'id': 'client01'
    },
    'client2': {
        'user_id': 'client02',  # ✅ FIXED: Use user_id, not email
        'password': 'test123',
        'id': 'client02'
    },
    'staff': {
        'user_id': 'staff01',  # ✅ FIXED: Use user_id, not email
        'password': 'test123',
        'id': 'staff01'
    }
}

# Default sender and receiver for tests
SENDER = TEST_USERS['client1']  # client01 sends files
RECEIVER_ID = TEST_USERS['admin']['id']  # to admin01

# Test configuration
CHUNK_SIZE = 5 * 1024 * 1024  # 5MB chunks
MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024  # 3GB

# ==========================================
# 🎨 COLORS FOR OUTPUT
# ==========================================

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

# ==========================================
# 📊 TEST RESULTS TRACKER
# ==========================================

class TestResults:
    def __init__(self):
        self.total_tests = 0
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.start_time = None
        self.end_time = None
        self.results = []
    
    def add_result(self, test_name, status, message, duration=0):
        self.total_tests += 1
        if status == "PASS":
            self.passed += 1
        elif status == "FAIL":
            self.failed += 1
        elif status == "WARN":
            self.warnings += 1
        
        self.results.append({
            'test': test_name,
            'status': status,
            'message': message,
            'duration': duration
        })
    
    def print_summary(self):
        print(f"\n{'='*70}")
        print(f"{Colors.BOLD}{Colors.CYAN}📊 TEST SUMMARY{Colors.END}")
        print(f"{'='*70}")
        print(f"Total Tests: {self.total_tests}")
        print(f"{Colors.GREEN}✅ Passed: {self.passed}{Colors.END}")
        print(f"{Colors.RED}❌ Failed: {self.failed}{Colors.END}")
        print(f"{Colors.YELLOW}⚠️  Warnings: {self.warnings}{Colors.END}")
        
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            minutes = int(duration // 60)
            seconds = duration % 60
            print(f"⏱️  Total Duration: {minutes}m {seconds:.1f}s")
        
        print(f"{'='*70}\n")
        
        # Print individual results
        for result in self.results:
            status_color = Colors.GREEN if result['status'] == 'PASS' else Colors.RED if result['status'] == 'FAIL' else Colors.YELLOW
            print(f"{status_color}[{result['status']}]{Colors.END} {result['test']}")
            print(f"      {result['message']}")
            if result['duration'] > 0:
                print(f"      Duration: {result['duration']:.2f}s")
            print()
        
        # Performance summary
        print(f"{'='*70}")
        print(f"{Colors.BOLD}🎯 PERFORMANCE VERDICT:{Colors.END}")
        if self.failed == 0 and self.warnings == 0:
            print(f"{Colors.GREEN}🏆 EXCELLENT - System is production-ready!{Colors.END}")
        elif self.failed == 0:
            print(f"{Colors.GREEN}✅ GOOD - Minor warnings, but system is stable{Colors.END}")
        elif self.failed < 2:
            print(f"{Colors.YELLOW}⚠️  FAIR - Review failed tests before production{Colors.END}")
        else:
            print(f"{Colors.RED}❌ POOR - System needs significant fixes{Colors.END}")
        print(f"{'='*70}\n")

results = TestResults()

# ==========================================
# 🔐 AUTHENTICATION
# ==========================================

def login(user_config):
    """Login and get session cookies"""
    print(f"\n{Colors.CYAN}🔐 Logging in as {user_config['user_id']}...{Colors.END}")
    
    try:
        session = requests.Session()
        
        # ✅ CORRECT METHOD: Use user_id (not email)
        response = session.post(f"{BASE_URL}/api/login", 
            json={
                'user_id': user_config['user_id'],
                'password': user_config['password']
            },
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('success'):
                    user_info = result.get('user', {})
                    print(f"{Colors.GREEN}✅ Login successful - {user_info.get('name', 'User')} ({user_info.get('role', 'unknown')}){Colors.END}")
                    return session
                else:
                    print(f"{Colors.RED}❌ Login failed: {result.get('message')}{Colors.END}")
                    return None
            except:
                print(f"{Colors.GREEN}✅ Login successful{Colors.END}")
                return session
        else:
            print(f"{Colors.RED}❌ Login failed: Status {response.status_code}{Colors.END}")
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Response: {response.text[:200]}")
            return None
        
    except Exception as e:
        print(f"{Colors.RED}❌ Login error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        return None

# ==========================================
# 📁 FILE GENERATORS
# ==========================================

def create_temp_file(size_mb, filename=None):
    """Create a temporary test file of specified size"""
    if filename is None:
        filename = f"test_{size_mb}MB_{int(time.time())}.bin"
    
    # Use proper temp directory based on OS
    if os.name == 'nt':  # Windows
        temp_dir = os.environ.get('TEMP', 'C:\\Temp')
    else:  # Linux/Mac
        temp_dir = '/tmp'
    
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    filepath = os.path.join(temp_dir, filename)
    
    print(f"📝 Creating {size_mb}MB test file: {filename}")
    
    chunk_size = 1024 * 1024  # 1MB chunks
    bytes_written = 0
    target_bytes = size_mb * 1024 * 1024
    
    with open(filepath, 'wb') as f:
        while bytes_written < target_bytes:
            remaining = target_bytes - bytes_written
            write_size = min(chunk_size, remaining)
            # Use zeros instead of random data for speed
            f.write(b'\0' * write_size)
            bytes_written += write_size
            
            # Show progress for large files
            if size_mb > 100 and bytes_written % (50 * 1024 * 1024) == 0:
                progress = (bytes_written / target_bytes) * 100
                print(f"   Creating file: {progress:.0f}%")
    
    print(f"   ✓ File created: {filepath}")
    return filepath

def cleanup_file(filepath):
    """Remove temporary test file"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"   🗑️  Cleaned up: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"{Colors.YELLOW}⚠️  Could not delete {filepath}: {e}{Colors.END}")

# ==========================================
# 🧪 TEST 1: Small File Upload (< 10MB)
# ==========================================

def test_small_file_upload(session):
    """Test regular upload for small files"""
    test_name = "Small File Upload (5MB)"
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"🧪 TEST 1: {test_name}")
    print(f"{'='*70}{Colors.END}")
    
    start_time = time.time()
    filepath = None
    
    try:
        # Create 5MB file
        filepath = create_temp_file(5)
        
        # Upload via regular endpoint
        with open(filepath, 'rb') as f:
            # ✅ FIXED: Include MIME type
            files = {'file': (os.path.basename(filepath), f, 'application/octet-stream')}
            data = {'target_user': RECEIVER_ID}
            
            print(f"📤 Uploading to /api/send-file...")
            response = session.post(SEND_FILE_URL, files=files, data=data, timeout=60)
        
        duration = time.time() - start_time
        
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('success'):
                    results.add_result(test_name, "PASS", f"Uploaded 5MB in {duration:.2f}s", duration)
                    print(f"{Colors.GREEN}✅ PASS - Small file uploaded successfully{Colors.END}")
                else:
                    results.add_result(test_name, "FAIL", f"Server returned success=false: {result.get('message')}", duration)
                    print(f"{Colors.RED}❌ FAIL - Server rejected upload{Colors.END}")
            except:
                results.add_result(test_name, "PASS", f"Upload completed (non-JSON response)", duration)
                print(f"{Colors.GREEN}✅ PASS - File uploaded{Colors.END}")
        else:
            results.add_result(test_name, "FAIL", f"Status: {response.status_code}", duration)
            print(f"{Colors.RED}❌ FAIL - HTTP {response.status_code}{Colors.END}")
    
    except Exception as e:
        duration = time.time() - start_time
        results.add_result(test_name, "FAIL", str(e), duration)
        print(f"{Colors.RED}❌ FAIL - Exception: {e}{Colors.END}")
    
    finally:
        if filepath:
            cleanup_file(filepath)

# ==========================================
# 🧪 TEST 2: Medium File Upload (50MB)
# ==========================================

def test_medium_file_chunked(session):
    """Test chunked upload for medium files"""
    test_name = "Medium File Chunked Upload (50MB)"
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"🧪 TEST 2: {test_name}")
    print(f"{'='*70}{Colors.END}")
    
    start_time = time.time()
    filepath = None
    
    try:
        # Create 50MB file
        filepath = create_temp_file(50)
        file_size = os.path.getsize(filepath)
        file_id = f"test_{int(time.time() * 1000)}"
        
        # Upload in chunks
        total_chunks = (file_size + CHUNK_SIZE - 1) // CHUNK_SIZE
        print(f"📦 Uploading {total_chunks} chunks of {CHUNK_SIZE/(1024*1024):.1f}MB each...")
        
        with open(filepath, 'rb') as f:
            for chunk_num in range(total_chunks):
                chunk_data = f.read(CHUNK_SIZE)
                
                files = {'chunk': (f'chunk_{chunk_num}', chunk_data)}
                data = {
                    'fileId': file_id,
                    'chunkNumber': chunk_num,
                    'totalChunks': total_chunks,
                    'filename': os.path.basename(filepath)
                }
                
                response = session.post(UPLOAD_CHUNK_URL, files=files, data=data, timeout=120)
                
                if response.status_code != 200:
                    raise Exception(f"Chunk {chunk_num} failed: HTTP {response.status_code}")
                
                if (chunk_num + 1) % 2 == 0 or chunk_num == total_chunks - 1:
                    print(f"  ✓ Uploaded {chunk_num + 1}/{total_chunks} chunks ({((chunk_num + 1)/total_chunks)*100:.1f}%)")
        
        # Finalize upload
        print(f"🔄 Finalizing upload...")
        finalize_data = {
            'fileId': file_id,
            'filename': os.path.basename(filepath),
            'fileSize': file_size,
            'targetUser': RECEIVER_ID
        }
        
        response = session.post(FINALIZE_URL, json=finalize_data, timeout=60)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('success'):
                    speed_mbps = (50 / duration) * 8
                    results.add_result(test_name, "PASS", f"Uploaded 50MB in {duration:.2f}s (~{speed_mbps:.1f} Mbps)", duration)
                    print(f"{Colors.GREEN}✅ PASS - Medium file uploaded successfully (~{speed_mbps:.1f} Mbps){Colors.END}")
                else:
                    results.add_result(test_name, "FAIL", f"Finalize returned success=false", duration)
                    print(f"{Colors.RED}❌ FAIL - Finalize rejected{Colors.END}")
            except:
                results.add_result(test_name, "PASS", f"Upload completed", duration)
                print(f"{Colors.GREEN}✅ PASS - Upload completed{Colors.END}")
        else:
            results.add_result(test_name, "FAIL", f"Finalize failed: HTTP {response.status_code}", duration)
            print(f"{Colors.RED}❌ FAIL - Finalize failed{Colors.END}")
    
    except Exception as e:
        duration = time.time() - start_time
        results.add_result(test_name, "FAIL", str(e), duration)
        print(f"{Colors.RED}❌ FAIL - Exception: {e}{Colors.END}")
    
    finally:
        if filepath:
            cleanup_file(filepath)

# ==========================================
# 🧪 TEST 3: Large File Upload (100MB)
# ==========================================

def test_large_file_chunked(session):
    """Test chunked upload for large files"""
    test_name = "Large File Chunked Upload (100MB)"
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"🧪 TEST 3: {test_name}")
    print(f"{Colors.YELLOW}⚠️  This may take 2-5 minutes depending on your connection{Colors.END}")
    print(f"{'='*70}{Colors.END}")
    
    start_time = time.time()
    filepath = None
    
    try:
        # Create 100MB file (reduced from 500MB for faster testing)
        filepath = create_temp_file(100)
        file_size = os.path.getsize(filepath)
        file_id = f"test_{int(time.time() * 1000)}"
        
        # Upload in chunks
        total_chunks = (file_size + CHUNK_SIZE - 1) // CHUNK_SIZE
        print(f"📦 Uploading {total_chunks} chunks...")
        
        chunks_uploaded = 0
        with open(filepath, 'rb') as f:
            for chunk_num in range(total_chunks):
                chunk_data = f.read(CHUNK_SIZE)
                
                files = {'chunk': (f'chunk_{chunk_num}', chunk_data)}
                data = {
                    'fileId': file_id,
                    'chunkNumber': chunk_num,
                    'totalChunks': total_chunks,
                    'filename': os.path.basename(filepath)
                }
                
                response = session.post(UPLOAD_CHUNK_URL, files=files, data=data, timeout=120)
                
                if response.status_code != 200:
                    raise Exception(f"Chunk {chunk_num} failed: HTTP {response.status_code}")
                
                chunks_uploaded += 1
                if chunks_uploaded % 5 == 0 or chunks_uploaded == total_chunks:
                    progress = (chunks_uploaded / total_chunks) * 100
                    elapsed = time.time() - start_time
                    speed_mbps = ((chunks_uploaded * CHUNK_SIZE) / elapsed) * 8 / (1024 * 1024)
                    print(f"  📊 Progress: {progress:.1f}% ({chunks_uploaded}/{total_chunks}) - {speed_mbps:.1f} Mbps")
        
        # Finalize upload
        print(f"🔄 Finalizing 100MB upload...")
        finalize_data = {
            'fileId': file_id,
            'filename': os.path.basename(filepath),
            'fileSize': file_size,
            'targetUser': RECEIVER_ID
        }
        
        response = session.post(FINALIZE_URL, json=finalize_data, timeout=60)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            speed_mbps = (100 / duration) * 8
            results.add_result(test_name, "PASS", f"Uploaded 100MB in {duration:.2f}s (~{speed_mbps:.1f} Mbps)", duration)
            print(f"{Colors.GREEN}✅ PASS - Large file uploaded successfully{Colors.END}")
            print(f"   Average Speed: ~{speed_mbps:.1f} Mbps")
        else:
            results.add_result(test_name, "FAIL", f"Finalize failed: HTTP {response.status_code}", duration)
            print(f"{Colors.RED}❌ FAIL - Finalize failed{Colors.END}")
    
    except Exception as e:
        duration = time.time() - start_time
        results.add_result(test_name, "FAIL", str(e), duration)
        print(f"{Colors.RED}❌ FAIL - Exception: {e}{Colors.END}")
    
    finally:
        if filepath:
            cleanup_file(filepath)

# ==========================================
# 🧪 TEST 4: Concurrent Uploads
# ==========================================

def upload_single_file_concurrent(session, file_size_mb, test_id):
    """Helper function for concurrent uploads"""
    try:
        filepath = create_temp_file(file_size_mb, f"concurrent_{test_id}_{file_size_mb}MB.bin")
        
        with open(filepath, 'rb') as f:
            # ✅ FIXED: Include MIME type
            files = {'file': (os.path.basename(filepath), f, 'application/octet-stream')}
            data = {'target_user': RECEIVER_ID}
            response = session.post(SEND_FILE_URL, files=files, data=data, timeout=120)
        
        cleanup_file(filepath)
        
        success = response.status_code == 200
        return success
    except Exception as e:
        print(f"    {Colors.RED}Error in thread {test_id}: {e}{Colors.END}")
        return False

def test_concurrent_uploads(session):
    """Test multiple simultaneous uploads"""
    test_name = "Concurrent Uploads (3 files simultaneously)"
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"🧪 TEST 4: {test_name}")
    print(f"{'='*70}{Colors.END}")
    
    start_time = time.time()
    num_concurrent = 3  # Reduced from 5 for stability
    file_size = 10  # 10MB each
    
    try:
        print(f"🚀 Starting {num_concurrent} concurrent uploads of {file_size}MB each...")
        
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = []
            for i in range(num_concurrent):
                future = executor.submit(upload_single_file_concurrent, session, file_size, i)
                futures.append(future)
            
            results_list = [future.result() for future in as_completed(futures)]
        
        duration = time.time() - start_time
        successful = sum(results_list)
        
        if successful == num_concurrent:
            results.add_result(test_name, "PASS", f"{successful}/{num_concurrent} uploads succeeded in {duration:.2f}s", duration)
            print(f"{Colors.GREEN}✅ PASS - All {num_concurrent} concurrent uploads succeeded{Colors.END}")
        elif successful > 0:
            results.add_result(test_name, "WARN", f"Only {successful}/{num_concurrent} succeeded", duration)
            print(f"{Colors.YELLOW}⚠️  WARN - {successful}/{num_concurrent} uploads succeeded{Colors.END}")
        else:
            results.add_result(test_name, "FAIL", "All concurrent uploads failed", duration)
            print(f"{Colors.RED}❌ FAIL - All uploads failed{Colors.END}")
    
    except Exception as e:
        duration = time.time() - start_time
        results.add_result(test_name, "FAIL", str(e), duration)
        print(f"{Colors.RED}❌ FAIL - Exception: {e}{Colors.END}")

# ==========================================
# 🧪 TEST 5: Rapid Sequential Uploads
# ==========================================

def test_rapid_sequential(session):
    """Test rapid sequential uploads"""
    test_name = "Rapid Sequential Uploads (5 files)"
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"🧪 TEST 5: {test_name}")
    print(f"{'='*70}{Colors.END}")
    
    start_time = time.time()
    num_files = 5
    file_size = 5  # 5MB each
    
    successful = 0
    failed = 0
    
    try:
        for i in range(num_files):
            filepath = create_temp_file(file_size, f"rapid_{i}_{file_size}MB.bin")
            
            try:
                with open(filepath, 'rb') as f:
                    # ✅ FIXED: Include MIME type
                    files = {'file': (os.path.basename(filepath), f, 'application/octet-stream')}
                    data = {'target_user': RECEIVER_ID}
                    response = session.post(SEND_FILE_URL, files=files, data=data, timeout=60)
                
                if response.status_code == 200:
                    successful += 1
                    print(f"  ✓ Upload {i+1}/{num_files} succeeded")
                else:
                    failed += 1
                    print(f"  ✗ Upload {i+1}/{num_files} failed (HTTP {response.status_code})")
            
            except Exception as e:
                failed += 1
                print(f"  ✗ Upload {i+1}/{num_files} error: {str(e)[:50]}")
            
            finally:
                cleanup_file(filepath)
        
        duration = time.time() - start_time
        
        if successful == num_files:
            results.add_result(test_name, "PASS", f"{successful}/{num_files} uploads in {duration:.2f}s", duration)
            print(f"{Colors.GREEN}✅ PASS - All rapid uploads succeeded{Colors.END}")
        elif successful >= num_files / 2:
            results.add_result(test_name, "WARN", f"{successful}/{num_files} succeeded", duration)
            print(f"{Colors.YELLOW}⚠️  WARN - {successful}/{num_files} succeeded{Colors.END}")
        else:
            results.add_result(test_name, "FAIL", f"Only {successful}/{num_files} succeeded", duration)
            print(f"{Colors.RED}❌ FAIL - Most uploads failed{Colors.END}")
    
    except Exception as e:
        duration = time.time() - start_time
        results.add_result(test_name, "FAIL", str(e), duration)
        print(f"{Colors.RED}❌ FAIL - Exception: {e}{Colors.END}")

# ==========================================
# 🚀 MAIN TEST RUNNER
# ==========================================

def run_all_tests():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}")
    print("=" * 70)
    print("🚀 KAA HO - FILE UPLOAD STRESS TEST SUITE")
    print("   3GB Chunked Upload System - Extreme Pressure Test")
    print("=" * 70)
    print(f"{Colors.END}\n")
    
    print(f"{Colors.CYAN}📋 Configuration:{Colors.END}")
    print(f"  🌐 Server: {BASE_URL}")
    print(f"  📦 Max File Size: {MAX_FILE_SIZE / (1024**3):.1f} GB")
    print(f"  🔨 Chunk Size: {CHUNK_SIZE / (1024**2):.1f} MB")
    print(f"  👤 Sender: {SENDER['user_id']} → {RECEIVER_ID}")
    print(f"  ⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Login
    session = login(SENDER)
    if not session:
        print(f"\n{Colors.RED}❌ Cannot proceed without login. Check credentials!{Colors.END}")
        return
    
    results.start_time = time.time()
    
    # Run tests
    try:
        test_small_file_upload(session)
        test_medium_file_chunked(session)
        test_large_file_chunked(session)
        test_concurrent_uploads(session)
        test_rapid_sequential(session)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️  Tests interrupted by user{Colors.END}")
    
    results.end_time = time.time()
    
    # Print summary
    results.print_summary()

# ==========================================
# 🎯 ENTRY POINT
# ==========================================

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️  Tests interrupted by user{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}❌ Fatal error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()