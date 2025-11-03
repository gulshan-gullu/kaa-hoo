#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CA360 CHAT - RIGOROUS STRESS TEST SUITE
WhatsApp & Telegram Level Testing
Save this as: rigorous_test.py
"""

import sys
sys.path.insert(0, '/app')

from database import save_message, get_all_users, get_messages, get_db
import random
import time
from datetime import datetime, timedelta
import threading

class StressTestSuite:
    def __init__(self):
        self.users = get_all_users()
        self.test_results = {}
        
    def print_header(self, title):
        print("\n" + "="*70)
        print(f" {title}")
        print("="*70)
    
    def print_result(self, test_name, passed, details=""):
        status = "✅ PASSED" if passed else "❌ FAILED"
        self.test_results[test_name] = passed
        print(f"{status} - {test_name}")
        if details:
            print(f"   {details}")
    
    # ==================== TEST 1: BURST MESSAGING ====================
    def test_burst_messaging(self, burst_size=100):
        """Test sending many messages in quick succession (like rapid typing)"""
        self.print_header(f"TEST 1: BURST MESSAGING ({burst_size} messages in <1 second)")
        
        sender = self.users[0]
        receiver = self.users[1]
        
        start_time = time.time()
        success_count = 0
        
        for i in range(burst_size):
            try:
                result = save_message(
                    sender['user_id'],
                    receiver['user_id'],
                    f"Rapid message #{i+1}",
                    'text'
                )
                if result:
                    success_count += 1
            except Exception as e:
                print(f"   Error at message {i}: {e}")
        
        duration = time.time() - start_time
        rate = success_count / duration if duration > 0 else 0
        
        passed = success_count >= burst_size * 0.95  # 95% success rate
        self.print_result(
            "Burst Messaging",
            passed,
            f"{success_count}/{burst_size} sent in {duration:.2f}s ({rate:.0f} msg/s)"
        )
        
        return passed
    
    # ==================== TEST 2: CONCURRENT USERS ====================
    def test_concurrent_users(self, num_threads=10, messages_per_thread=50):
        """Test multiple users sending messages simultaneously"""
        self.print_header(f"TEST 2: CONCURRENT USERS ({num_threads} users, {messages_per_thread} msg each)")
        
        results = {'success': 0, 'errors': 0}
        lock = threading.Lock()
        
        def send_messages_thread(thread_id):
            sender = self.users[thread_id % len(self.users)]
            receiver = self.users[(thread_id + 1) % len(self.users)]
            
            for i in range(messages_per_thread):
                try:
                    result = save_message(
                        sender['user_id'],
                        receiver['user_id'],
                        f"Thread {thread_id} - Message {i+1}",
                        'text'
                    )
                    with lock:
                        if result:
                            results['success'] += 1
                        else:
                            results['errors'] += 1
                except Exception as e:
                    with lock:
                        results['errors'] += 1
        
        threads = []
        start_time = time.time()
        
        for i in range(num_threads):
            t = threading.Thread(target=send_messages_thread, args=(i,))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        duration = time.time() - start_time
        total_messages = num_threads * messages_per_thread
        rate = results['success'] / duration if duration > 0 else 0
        
        passed = results['success'] >= total_messages * 0.90  # 90% success rate
        self.print_result(
            "Concurrent Users",
            passed,
            f"{results['success']}/{total_messages} sent, {results['errors']} errors in {duration:.2f}s ({rate:.0f} msg/s)"
        )
        
        return passed
    
    # ==================== TEST 3: LARGE MESSAGES ====================
    def test_large_messages(self, count=50):
        """Test sending very large messages (like long paragraphs)"""
        self.print_header(f"TEST 3: LARGE MESSAGES ({count} messages, 5KB each)")
        
        sender = self.users[0]
        receiver = self.users[1]
        
        # Create 5KB message
        large_text = "Lorem ipsum dolor sit amet. " * 180  # ~5KB
        
        success_count = 0
        start_time = time.time()
        
        for i in range(count):
            try:
                result = save_message(
                    sender['user_id'],
                    receiver['user_id'],
                    f"Large message {i+1}: {large_text}",
                    'text'
                )
                if result:
                    success_count += 1
            except Exception as e:
                print(f"   Error at message {i}: {e}")
        
        duration = time.time() - start_time
        passed = success_count >= count * 0.95
        
        self.print_result(
            "Large Messages",
            passed,
            f"{success_count}/{count} sent in {duration:.2f}s"
        )
        
        return passed
    
    # ==================== TEST 4: MESSAGE RETRIEVAL SPEED ====================
    def test_retrieval_speed(self, retrieval_count=100):
        """Test how fast messages can be retrieved (like opening a chat)"""
        self.print_header(f"TEST 4: MESSAGE RETRIEVAL ({retrieval_count} retrievals)")
        
        user1 = self.users[0]['user_id']
        user2 = self.users[1]['user_id']
        
        times = []
        errors = 0
        
        for i in range(retrieval_count):
            try:
                start = time.time()
                messages = get_messages(user1, user2, limit=50)
                duration = time.time() - start
                times.append(duration)
            except Exception as e:
                errors += 1
        
        if times:
            avg_time = sum(times) / len(times)
            max_time = max(times)
            min_time = min(times)
            
            # WhatsApp standard: <100ms for retrieval
            passed = avg_time < 0.1 and errors == 0
            
            self.print_result(
                "Retrieval Speed",
                passed,
                f"Avg: {avg_time*1000:.1f}ms, Min: {min_time*1000:.1f}ms, Max: {max_time*1000:.1f}ms, Errors: {errors}"
            )
            
            return passed
        else:
            self.print_result("Retrieval Speed", False, "All retrievals failed")
            return False
    
    # ==================== TEST 5: DATABASE CONSISTENCY ====================
    def test_database_consistency(self):
        """Verify all messages are properly stored and retrievable"""
        self.print_header("TEST 5: DATABASE CONSISTENCY")
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Check for NULL values
        cursor.execute("SELECT COUNT(*) as count FROM messages WHERE text IS NULL")
        null_texts = cursor.fetchone()['count']
        
        # Check for orphaned messages (invalid user IDs)
        cursor.execute("""
            SELECT COUNT(*) as count FROM messages m
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE user_id = m.sender_id)
               OR NOT EXISTS (SELECT 1 FROM users WHERE user_id = m.receiver_id)
        """)
        orphaned = cursor.fetchone()['count']
        
        # Check for duplicate timestamps (potential race condition)
        cursor.execute("""
            SELECT sender_id, receiver_id, timestamp, COUNT(*) as count
            FROM messages
            GROUP BY sender_id, receiver_id, timestamp
            HAVING count > 5
        """)
        duplicates = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        passed = null_texts == 0 and orphaned == 0 and len(duplicates) == 0
        
        details = f"NULL texts: {null_texts}, Orphaned: {orphaned}, Duplicate groups: {len(duplicates)}"
        self.print_result("Database Consistency", passed, details)
        
        return passed
    
    # ==================== TEST 6: EMOJI & SPECIAL CHARACTERS ====================
    def test_special_characters(self, count=50):
        """Test messages with emojis and special characters"""
        self.print_header(f"TEST 6: SPECIAL CHARACTERS ({count} messages)")
        
        sender = self.users[0]
        receiver = self.users[1]
        
        special_messages = [
            "Hello 👋 World 🌍!",
            "Testing 中文字符",
            "Arabic: مرحبا",
            "Emoji combo: 🔥💪🚀✨",
            "Special chars: @#$%^&*()",
            "Mixed: Hello世界🌍Test",
            "Line\nbreak\ntest",
            "Tab\ttest\there",
            "Quote \"test\" here",
            "Apostrophe's test",
        ]
        
        success_count = 0
        
        for i in range(count):
            try:
                msg = random.choice(special_messages)
                result = save_message(
                    sender['user_id'],
                    receiver['user_id'],
                    f"{msg} #{i+1}",
                    'text'
                )
                if result:
                    success_count += 1
            except Exception as e:
                print(f"   Error with message {i}: {e}")
        
        passed = success_count >= count * 0.95
        self.print_result(
            "Special Characters",
            passed,
            f"{success_count}/{count} sent successfully"
        )
        
        return passed
    
    # ==================== TEST 7: SUSTAINED LOAD ====================
    def test_sustained_load(self, duration_seconds=30):
        """Test continuous messaging for extended period"""
        self.print_header(f"TEST 7: SUSTAINED LOAD ({duration_seconds} seconds)")
        
        success_count = 0
        error_count = 0
        start_time = time.time()
        
        while time.time() - start_time < duration_seconds:
            try:
                sender = random.choice(self.users)
                receiver = random.choice([u for u in self.users if u['user_id'] != sender['user_id']])
                
                result = save_message(
                    sender['user_id'],
                    receiver['user_id'],
                    f"Sustained load message at {time.time():.2f}",
                    'text'
                )
                
                if result:
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
        
        actual_duration = time.time() - start_time
        rate = success_count / actual_duration
        
        passed = rate >= 50 and error_count < success_count * 0.05  # At least 50 msg/s, <5% errors
        
        self.print_result(
            "Sustained Load",
            passed,
            f"{success_count} messages in {actual_duration:.1f}s ({rate:.1f} msg/s), {error_count} errors"
        )
        
        return passed
    
    # ==================== TEST 8: PEAK HOUR SIMULATION ====================
    def test_peak_hour(self, peak_messages=1000):
        """Simulate peak hour traffic (all users active)"""
        self.print_header(f"TEST 8: PEAK HOUR SIMULATION ({peak_messages} messages)")
        
        success_count = 0
        start_time = time.time()
        
        # Simulate realistic peak hour: multiple conversations simultaneously
        conversations = []
        for i in range(0, len(self.users)-1, 2):
            conversations.append((self.users[i], self.users[i+1]))
        
        messages_per_conversation = peak_messages // len(conversations)
        
        for sender, receiver in conversations:
            for i in range(messages_per_conversation):
                try:
                    result = save_message(
                        sender['user_id'],
                        receiver['user_id'],
                        f"Peak hour message {i+1}",
                        'text'
                    )
                    if result:
                        success_count += 1
                except:
                    pass
        
        duration = time.time() - start_time
        rate = success_count / duration
        
        passed = success_count >= peak_messages * 0.90 and rate >= 60  # 90% success, 60+ msg/s
        
        self.print_result(
            "Peak Hour Simulation",
            passed,
            f"{success_count}/{peak_messages} sent in {duration:.1f}s ({rate:.1f} msg/s)"
        )
        
        return passed
    
    # ==================== RUN ALL TESTS ====================
    def run_all_tests(self):
        print("\n")
        print("╔" + "="*68 + "╗")
        print("║" + " "*15 + "CA360 CHAT - RIGOROUS STRESS TEST" + " "*20 + "║")
        print("║" + " "*15 + "WhatsApp & Telegram Level Testing" + " "*19 + "║")
        print("╚" + "="*68 + "╝")
        
        start_time = time.time()
        
        # Run all tests
        self.test_burst_messaging(100)
        self.test_concurrent_users(10, 50)
        self.test_large_messages(50)
        self.test_retrieval_speed(100)
        self.test_database_consistency()
        self.test_special_characters(50)
        self.test_sustained_load(30)
        self.test_peak_hour(1000)
        
        total_duration = time.time() - start_time
        
        # Summary
        self.print_header("FINAL RESULTS")
        
        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"\n{'Test Name':<30} {'Status'}")
        print("-" * 70)
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<30} {status}")
        
        print("\n" + "="*70)
        print(f"TOTAL: {passed}/{total} tests passed ({percentage:.1f}%)")
        print(f"TIME: {total_duration:.1f} seconds")
        print("="*70)
        
        if percentage >= 90:
            print("\n🎉 EXCELLENT! Your system is WhatsApp/Telegram level! 🚀")
        elif percentage >= 75:
            print("\n✅ GOOD! System is production-ready with minor improvements needed.")
        elif percentage >= 50:
            print("\n⚠️  NEEDS WORK! System functions but requires optimization.")
        else:
            print("\n❌ CRITICAL! System needs significant improvements.")
        
        print("\n")

if __name__ == "__main__":
    tester = StressTestSuite()
    tester.run_all_tests()