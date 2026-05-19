import tkinter as tk
from tkinter import ttk

GRID_CELL_SIZE = 48

def test_layout(core_count=12):
    window = tk.Tk()
    window.title(f"布局测试 - {core_count}核")
    window.configure(bg='#f0f0f0')
    
    cols = min(4, core_count)
    rows = (core_count + cols - 1) // cols
    
    cell_size = GRID_CELL_SIZE
    cell_pad = 4
    padding = 10
    
    cell_total_width = cell_size + cell_pad
    cell_total_height = cell_size + cell_pad
    
    content_width = cols * cell_total_width + padding * 2
    max_display_rows = min(rows, 8)
    content_height = max_display_rows * cell_total_height + padding * 2
    
    scrollbar_width = 20 if rows > max_display_rows else 0
    window_width = content_width + scrollbar_width
    window_height = content_height + 40
    
    print(f"核心数: {core_count}")
    print(f"列数: {cols}, 行数: {rows}")
    print(f"窗口尺寸: {window_width}x{window_height}")
    print(f"单元格尺寸: {cell_size}x{cell_size}")
    print(f"滚动条: {'显示' if rows > max_display_rows else '不显示'}")
    
    window.geometry(f"{window_width}x{window_height}")
    
    title_frame = tk.Frame(window, bg='#f0f0f0')
    title_frame.pack(fill='x', padx=padding, pady=(padding, 5))
    tk.Label(title_frame, text=f"CPU核心使用率 ({core_count}核)", 
             bg='#f0f0f0', font=('Arial', 9, 'bold')).pack(side='left')
    
    close_btn = tk.Label(title_frame, text="×", bg='#f0f0f0', 
                        font=('Arial', 12, 'bold'), fg='gray', cursor='hand2')
    close_btn.pack(side='right')
    close_btn.bind('<Button-1>', lambda e: window.destroy())
    
    container = tk.Frame(window, bg='#f0f0f0')
    container.pack(fill='both', expand=True, padx=padding, pady=(0, padding))
    
    canvas = tk.Canvas(container, bg='#f0f0f0', highlightthickness=0)
    scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
    scrollable_frame = tk.Frame(canvas, bg='#f0f0f0')
    
    scrollable_frame.bind(
        "<Configure>",
        lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
    )
    
    canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)
    
    if rows > max_display_rows:
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    else:
        canvas.pack(side="left", fill="both", expand=True)
    
    def on_mousewheel(event):
        canvas.yview_scroll(int(-1*(event.delta/120)), "units")
    
    canvas.bind_all("<MouseWheel>", on_mousewheel)
    
    grid_frame = tk.Frame(scrollable_frame, bg='#f0f0f0')
    grid_frame.pack(fill='both', expand=True)
    
    for col in range(cols):
        grid_frame.grid_columnconfigure(col, weight=1)
    
    for i in range(core_count):
        row = i // cols
        col = i % cols
        
        frame = tk.Frame(grid_frame, bg='white', relief='solid', bd=1, 
                       width=cell_size, height=cell_size)
        frame.grid(row=row, column=col, padx=cell_pad//2, pady=cell_pad//2, sticky='nsew')
        frame.grid_propagate(False)
        
        label = tk.Label(frame, bg='white', text=f"CPU{i}", font=('Arial', 8))
        label.pack(padx=2, pady=(2, 0), expand=True)
        
        usage_label = tk.Label(frame, text=f"{(i*8)%100}%", bg='white', font=('Arial', 7))
        usage_label.pack(pady=(0, 2))
    
    window.mainloop()

if __name__ == '__main__':
    import sys
    cores = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    test_layout(cores)
