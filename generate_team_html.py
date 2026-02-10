
import os

files = [
    "Miss. Gauri Mathur.jpg", "Miss. Ishita Tripathi.jpg", "Miss. Lehar Nimodiya.jpg",
    "Miss. Rutu Vekariya.jpg", "Miss. Taniya Shah.jpg", "Miss. Vedika Jawaria.jpg",
    "Mr. Aarav Rai Mathur.jpg", "Mr. Aditya Wagh.jpg", "Mr. Aryan Chandani.jpg",
    "Mr. Harshvardhan Karadbhajre.jpg", "Mr. Jay Patel.jpg", "Mr. Krish Prajapati.jpg",
    "Mr. Krish Umredkar.jpg", "Mr. Lavesh Patil.jpg", "Mr. Parth Saxena.jpg",
    "Mr. Rohan Painter.jpg", "Mr. Sarthak Rathi.jpg", "Mr. Shrivin Nave.jpg",
    "Mr. Srikar Molahalli.jpg", "Mr. Vaidik Nandawana.jpg", "Mr. Vihan Joshi.jpg"
]

html_output = ""

for i, filename in enumerate(files):
    name = filename.replace(".jpg", "").replace(".", "")
    # Clean up multiple dots if any
    name = name.replace("Title ", "") # Not needed as I saw names like "Miss. Name"
    
    # Just use filename without extension as requested
    display_name = filename.replace(".jpg", "")
    
    number = f"[[{i+1:03}]]"
    
    html_output += f"""
                <article class="team-member">
                    <div class="team-member-image">
                        <div class="image-container">
                            <img src="/assets/pics/{filename}" alt="{display_name}" style="width:100%; height:100%; object-fit:cover;">
                            <div class="pixelate-overlay"></div>
                        </div>
                        <div class="member-number">{number}</div>
                    </div>
                    <div class="team-member-info">
                        <h3 class="team-member-name">{display_name}</h3>
                        <p class="team-member-role">Team Member</p>
                    </div>
                </article>
"""

with open("d:/AMBIORA/team_members.html", "w", encoding="utf-8") as f:
    f.write(html_output)
