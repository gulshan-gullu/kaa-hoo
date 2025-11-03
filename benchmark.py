"""
CA360 Chat Performance Benchmark Tool
Measures system performance and generates reports
"""
import time
import os
import json
from datetime import datetime
import statistics

class PerformanceBenchmark:
    def __init__(self):
        self.results = {}
        self.start_time = None
    
    def benchmark(self, name, func, iterations=100):
        """Benchmark a function"""
        print(f'Benchmarking: {name}...')
        times = []
        
        for i in range(iterations):
            start = time.time()
            func()
            end = time.time()
            times.append(end - start)
        
        # Calculate statistics
        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        median_time = statistics.median(times)
        
        self.results[name] = {
            'average': avg_time,
            'min': min_time,
            'max': max_time,
            'median': median_time,
            'iterations': iterations,
            'total': sum(times)
        }
        
        print(f'  Average: {avg_time*1000:.2f}ms')
        print(f'  Min: {min_time*1000:.2f}ms')
        print(f'  Max: {max_time*1000:.2f}ms')
        print()
    
    def run_all_benchmarks(self):
        """Run all performance benchmarks"""
        print('='*60)
        print('CA360 CHAT - PERFORMANCE BENCHMARK')
        print('='*60)
        print()
        
        # File I/O Benchmarks
        def read_login_html():
            with open('templates/login.html', 'r', encoding='utf-8') as f:
                _ = f.read()
        
        def read_login_js():
            with open('static/js/login-page.js', 'r', encoding='utf-8') as f:
                _ = f.read()
        
        self.benchmark('Read Login HTML', read_login_html)
        self.benchmark('Read Login JS', read_login_js)
        
        # String Operations
        def string_processing():
            text = 'CA360 Chat System' * 100
            _ = text.upper().lower().replace('Chat', 'MESSAGE')
        
        self.benchmark('String Processing', string_processing, 1000)
        
        # List Operations
        def list_operations():
            items = list(range(1000))
            _ = [x * 2 for x in items if x % 2 == 0]
        
        self.benchmark('List Operations', list_operations, 1000)
        
        # Dictionary Operations
        def dict_operations():
            data = {f'key_{i}': f'value_{i}' for i in range(100)}
            _ = {k: v.upper() for k, v in data.items()}
        
        self.benchmark('Dict Operations', dict_operations, 1000)
        
        # Call State Simulation
        def call_state_simulation():
            states = ['ringing', 'ongoing', 'ended']
            for state in states:
                _ = state
        
        self.benchmark('Call State Changes', call_state_simulation, 10000)
        
        self.generate_report()
    
    def generate_report(self):
        """Generate performance report"""
        print('='*60)
        print('PERFORMANCE REPORT')
        print('='*60)
        print()
        
        # Sort by average time
        sorted_results = sorted(self.results.items(), key=lambda x: x[1]['average'])
        
        for name, stats in sorted_results:
            print(f'{name}:')
            print(f'  Average: {stats["average"]*1000:.2f}ms')
            print(f'  Median:  {stats["median"]*1000:.2f}ms')
            print(f'  Range:   {stats["min"]*1000:.2f}ms - {stats["max"]*1000:.2f}ms')
            print()
        
        # Save to file
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'results': self.results
        }
        
        os.makedirs('reports', exist_ok=True)
        with open('reports/performance_benchmark.json', 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print('Report saved to: reports/performance_benchmark.json')
        print()
        
        # Performance grades
        print('='*60)
        print('PERFORMANCE GRADES')
        print('='*60)
        print()
        
        for name, stats in self.results.items():
            avg_ms = stats['average'] * 1000
            
            if avg_ms < 1:
                grade = 'EXCELLENT'
                emoji = '🟢'
            elif avg_ms < 10:
                grade = 'GOOD'
                emoji = '🟡'
            elif avg_ms < 100:
                grade = 'FAIR'
                emoji = '🟠'
            else:
                grade = 'NEEDS OPTIMIZATION'
                emoji = '🔴'
            
            print(f'{emoji} {name}: {grade} ({avg_ms:.2f}ms)')
        
        print()
        print('='*60)

if __name__ == '__main__':
    benchmark = PerformanceBenchmark()
    benchmark.run_all_benchmarks()
