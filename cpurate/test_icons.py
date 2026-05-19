import os
from cpurate import CatIconGenerator

def test_icons():
    generator = CatIconGenerator()
    
    os.makedirs('test_output', exist_ok=True)
    
    head_icon = generator.create_head_icon()
    head_icon.save('test_output/head.png')
    print(f"✓ 猫头图标已生成: test_output/head.png (尺寸: {head_icon.size})")
    
    run_frames = generator.create_run_frames()
    for i, frame in enumerate(run_frames):
        frame.save(f'test_output/run_{i}.png')
    print(f"✓ 奔跑动画帧已生成: {len(run_frames)} 帧")
    
    gif_frames = run_frames * 2
    gif_frames[0].save(
        'test_output/running_cat.gif',
        save_all=True,
        append_images=gif_frames[1:],
        duration=150,
        loop=0
    )
    print("✓ 奔跑动画GIF已生成: test_output/running_cat.gif")
    
    print("\n所有图标测试通过!")

if __name__ == '__main__':
    test_icons()
