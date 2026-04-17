// app/data/symptomInfo.ts

/*
    This file contains a comprehensive data structure that provides detailed information about various symptoms that individuals may experience during different phases of the menstrual cycle. 
    Each symptom entry includes a description, the typical cycle phase during which it occurs, tips for managing the symptom, shopping list recommendations for products that may help alleviate the symptom, and explanations for why the symptom may occur during each phase of the menstrual cycle.
    The data is organized in a way that allows for easy retrieval and display of symptom information within the CycleSense app, providing users with valuable insights and practical advice for managing their symptoms throughout their menstrual cycle.

    Each Field:
    - description: A brief explanation of the symptom and what it entails.
    - typicalCyclePhase: The phase of the menstrual cycle during which the symptom is most commonly experienced.
    - tips: Practical advice and strategies for managing the symptom effectively.
    - shoppingList: Recommendations for products that may help alleviate the symptom, if applicable.
    - phaseReasons: An explanation of why the symptom may occur during each phase of the menstrual cycle, providing users with a better understanding of the hormonal and physiological changes that contribute to their symptoms.

    Key features:
    - Provides a comprehensive overview of common symptoms experienced during the menstrual cycle, along with practical tips and product recommendations for managing those symptoms.
    - Offers explanations for why symptoms may occur during different phases of the menstrual cycle, helping users understand the underlying causes of their symptoms and how they relate to hormonal changes.
    - Organized in a way that allows for easy retrieval and display of symptom information within the CycleSense app, enhancing the user experience and providing valuable insights for users to manage their menstrual health effectively.
    
*/

// Exports for symptom information, including descriptions, typical cycle phases, tips for managing symptoms, shopping list recommendations, and explanations for why symptoms may occur during different menstrual cycle phases. 
export const symptomInfo:Record<string, any> = {
    "Happy": {
        description: "Feeling good, positive mood, and overall well-being.",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "Take advantage of your high energy levels to engage in social activities or start new projects.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your positive mood.",
            "Consider trying new hobbies or activities that you enjoy during this time.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual : "You may experience relief after your period starts and hormones begin to stabilize.",
            Follicular : "Rising estrogen levels can boost mood and energy, leading to feelings of happiness.",
            Ovulation : "Peak estrogen levels can enhance mood and increase feelings of happiness.",
            Luteal : "Some individuals may experience a temporary boost in mood during the early luteal phase before progesterone levels rise."
        }


    },

    "Calm": {
        description: "Feeling relaxed, at ease, and emotionally stable.",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "Use this time to focus on self-care and relaxation techniques, such as meditation or yoga.",
            "Engage in activities that promote mental well-being, like reading or spending time in nature.",
            "Consider scheduling important tasks or social events during this phase when you may feel more emotionally balanced.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Lower energy can lead to a more introspective and calm state.",
            Follicular: "Balanced hormones can contribute to a sense of calm and emotional stability.",
            Ovulation: "Some individuals may experience a sense of calm and confidence during ovulation due to peak estrogen levels.",
            Luteal: "The early luteal phase may still have some of the calming effects of estrogen before progesterone levels rise and potentially cause mood changes."
        }
    },

    "Anxious": {
        description: "Feeling nervous, worried, or uneasy about something.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Practice deep breathing exercises or progressive muscle relaxation to manage anxiety.",
            "Reduce caffeine and sugar intake, as they can exacerbate feelings of anxiety.",
            "Consider talking to a trusted friend or counselor about your concerns.",
        ],
        shoppingList: [
            "Chamomile tea",
            "Lavender essential oil",
            "Magnesium supplements",
        ],
        phaseReasons: {
            Menstrual: "Hormonal drops during menstruation can contribute to feelings of anxiety for some individuals.",
            Follicular: "Hormones adjusting after menstruation can lead to temporary feelings of unease.",
            Ovulation: "Heightened estrogen levels during ovulation can increase anxiety.",
            Luteal: "The drop in progesterone and estrogen levels in the luteal phase can contribute to increased anxiety."
        }
    },

    "Irritable": {
        description: "Feeling easily annoyed, frustrated, or short-tempered.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Prioritize rest and ensure you're getting enough sleep to help manage irritability.",
            "Practice stress-management techniques, such as deep breathing or mindfulness.",
            "Consider discussing your feelings with a trusted friend or counselor.",
        ],
        shoppingList: [
            "Valerian root supplements",
            "Passionflower tea",
            "Omega-3 fatty acid supplements",
        ],
        phaseReasons: {
            Menstrual: "Hormone levels are low during menstruation, which can contribute to irritability.",
            Follicular: "Mood usually improves during the follicular phase, but some individuals may still experience irritability as hormones adjust after menstruation.",
            Ovulation: "High energy and stimulation can sometimes lead to frustration and irritability.",
            Luteal: "The drop in estrogen and progesterone levels in the luteal phase can contribute to increased irritability and emotional sensitivity."
        }
    },

    "Low Mood" : {
        description: "Feeling down, sad, or experiencing a lack of interest in activities.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Get some sunlight and engage in physical activity, as both can help boost mood.",
            "Consider talking to a trusted friend or counselor about your feelings.",
            "Practice self-compassion and remind yourself that it's normal to experience mood fluctuations.",
        ],
        shoppingList: [
            "Vitamin D supplements",
            "Chocolate",
            "Comfort Foods"
        ],
        phaseReasons: {
            Menstrual: "Hormone levels are low during menstruation, which can contribute to feelings of low mood",
            Follicular: "Your mood may still be recovering post-period, but rising estrogen levels can help improve mood as the phase progresses.",
            Ovulation: "This is less common in the ovualtion phase but hormonal fluctuations can still cause mood changes for some individuals.",
            Luteal: "The hormonal drop before a period can lower mood and contribute to feelings of sadness or lack of interest in activities."
        }

    },

    "Mood Swings": {
        description: "Experiencing rapid and intense changes in mood.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Maintain a stable sleep and meal schedule to help regulate mood.",
            "Magnesium may help with mood regulation",
            "Consider talking to a trusted friend or counselor about your feelings.",
        ],
        shoppingList: [
            "Magnesium supplements",
            "Dark chocolate",
            "Leafy green vegetables"
        ],
        phaseReasons: {
            Menstrual: "Hormone levels are at the lowest during menstruation, which can contribute to mood swings.",
            Follicular: "Your mood may stil be recovering post-period, but rising estrogen levels can help stabilize mood as the phase progresses.",
            Ovulation: "This is less common in the ovualtion phase but hormonal fluctuations can still cause mood changes for some individuals.",
            Luteal: "The drop in estrogen and progesterone levels in the luteal phase can contribute to increased irritability and emotional sensitivity."
        }
    },

    "Emotional": {
        description: "Feeling more sensitive, emotional, or easily moved to tears.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Allow yourself to feel and express your emotions without judgment.",
            "Journaling can be a helpful way to process your feelings during this time.",
            "Practice self-care and engage in activities that bring you comfort and joy.",
        ],
        shoppingList: [
            "Comfort foods",
            "Chamomile tea",
            "Chocolate"
        ],
        phaseReasons: {
            Menstrual: "Hormone levels are at the lowest during menstruation, which can contribute to mood swings.",
            Follicular: "Your mood may stil be recovering post-period, but rising estrogen levels can help stabilize mood as the phase progresses.",
            Ovulation: "This is less common in the ovualtion phase but hormonal fluctuations can still cause mood changes for some individuals.",
            Luteal: "The drop in estrogen and progesterone levels in the luteal phase can contribute to increased irritability and emotional sensitivity."
        }
    },

    "Energised" : {
        description: "Feeling lively, active, and full of energy.",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is great time to workout or engage in physical activities that you enjoy.",
            "Consider scheduling social events or important tasks during this phase when you may feel more energetic.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your energy levels.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Energy may begin to return after rest",
            Follicular: "The rise in estrogen can boost energy levels and improve mood, leading to feelings of being energized.",
            Ovulation: "This is the peak of energy due to high estrogen levels, which can enhance mood and increase feelings of vitality.",
            Luteal: "In the early luteal phase, you may still feel some of the energizing effects of estrogen before progesterone levels rise and potentially cause fatigue."
        }
    },

    "Exhausted": {
        description: "Feeling extremely tired, drained, or lacking energy.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Prioritize rest and ensure you're getting enough sleep to help manage exhaustion.",
            "Iron-rich foods can help combat fatigue, especially during menstruation.",
            "Reduce physical and mental stress as much as possible during this time.",
        ],
        shoppingList: [
            "Iron supplements",
            "Coffee",
            "Energy drinks (in moderation)",
        ],
        phaseReasons: {
            Menstrual: "Blood loss and low hormone levels during menstruation can contribute to feelings of exhaustion.",
            Follicular: "The body is recovering from menstruation some individuals may still feel tired, but energy levels typically start to improve as estrogen rises.",
            Ovulation: "Energy levels can dip after the peak of ovulation due to hormonal fluctuations, but many individuals still feel energized during this phase.",
            Luteal: "Progesterone increase can cause fatigue and lower energy levels, especially in the later luteal phase leading up to menstruation."
        }

    },

    "Cramps": {
        description: "Experiencing painful contractions in the lower abdomen, often associated with menstruation.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Applying heat to the lower abdomen can help relieve cramps.",
            "Over-the-counter pain relievers, such as ibuprofen, can be effective for managing menstrual cramps.",
            "Gentle exercise, like walking or yoga, may help reduce cramping for some individuals.",
        ],
        shoppingList: [
            "Heating pad",
            "Ibuprofen",
            "Ginger tea"
        ],
        phaseReasons: {
            Menstrual: "Uterus contractions to shed the uterine lining can cause cramps, and prostaglandins released during menstruation can lead to cramping.",
            Follicular: "This is less common as the lining rebuilds but some individuals may still experience mild cramping as the uterus adjusts.",
            Ovulation: "Mild cramping can occur during ovulation due to the release of an egg and hormonal changes, but it's typically less intense than menstrual cramps.",
            Luteal: "Hormonal changes in the luteal phase can sometimes cause mild cramping or discomfort, especially as the body prepares for menstruation."
        }
    },

    "Headache": {
        description: "Experiencing pain or discomfort in the head, which can range from mild to severe.",
        typicalCyclePhase: "Menstrual phase and Luteal phase",
        tips: [
            "Stay hydrated and avoid skipping meals, as dehydration and low blood sugar can trigger headaches.",
            "Rest in a quiet, dark room if you experience a headache, and consider using a cold compress on your forehead.",
            "Over-the-counter pain relievers, such as ibuprofen or acetaminophen, can help manage headache pain.",
        ],
        shoppingList: [
            "Pain relievers",
            "Cold compress",
            "Hydrating beverages"
        ],
        phaseReasons: {
            Menstrual: "The drop in estrogen levels during menstruation can trigger headaches.",
            Follicular: "Hormone shifts may affect head tension and blood flow, but headaches are less common during this phase.",
            Ovulation: "The hormonal peak can trigger migraines.",
            Luteal: "Hormonal changes in the luteal phase can sometimes cause headaches, especially as the body prepares for menstruation."
        }
    },

    "Migraine": {
        description: "A type of headache characterized by intense, throbbing pain, often accompanied by nausea, vomiting, and sensitivity to light and sound.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Identify and avoid potential migraine triggers, such as certain foods, stress, or hormonal changes.",
            "Consider keeping a migraine diary to track patterns and triggers.",
            "Rest and use over-the-counter pain relievers, such as ibuprofen or acetaminophen, to manage migraine symptoms. If migraines are severe or frequent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Aspirin",
            "Migraine relief medications",
            "Hydrating beverages"
        ],
        phaseReasons: {
            Menstrual: "The drop in estrogen levels during menstruation can trigger migraines.",
            Follicular: "Hormone shifts may affect migraine frequency, but migraines are less common during this phase.",
            Ovulation: "The hormonal peak can trigger migraines.",
            Luteal: "Hormonal changes in the luteal phase can sometimes cause migraines, especially as the body prepares for menstruation."
        }
    },

    "Back pain": {
        description: "Experiencing discomfort or pain in the back, which can range from mild to severe.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Applying heat to the lower back can help relieve pain.",
            "Gentle stretching and low-impact exercises, such as yoga or walking, may help alleviate back pain for some individuals.",
            "Over-the-counter pain relievers, such as ibuprofen, can be effective for managing back pain during menstruation.",
        ],
        shoppingList: [
            "Heating pad",
            "Ibuprofen",
            "Epsom salt"
        ],
        phaseReasons: {
            Menstrual: "Uterine contractions can lead to lower back pain because of shared nerve pathway.",
            Follicular: "This is less common as the lining rebuilds but some individuals may still experience mild back pain as the uterus adjusts.",
            Ovulation: "Hormonal shifts may cause lower back discomfort for some individuals, but it's typically less intense than menstrual back pain.",
            Luteal: "Water retention can add pressure to the back."
        }
    },

    "Tender breasts": {
        description: "Experiencing soreness, sensitivity, or discomfort in the breasts.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Wearing a supportive bra can help reduce breast discomfort.",
            "Applying a warm compress to the breasts may provide relief from tenderness.",
            "Consider reducing caffeine intake, as it can sometimes exacerbate breast tenderness.",
        ],
        shoppingList: [
            "Supportive bra",
            "Warm compress",
            "Caffeine-free beverages"
        ],
        phaseReasons: {
            Menstrual: "As hormone levels drop during menstruation, breast tissue can become less swollen and tender.",
            Follicular: "Low hormone levels during the early follicular phase can lead to reduced breast tenderness.",
            Ovulation: "Hormonal rises can cause some breast tenderness, but it's typically less intense than in the luteal phase.",
            Luteal: "The progesteronre increase in the luteal phase can cause breast tissue to swell and become tender."
        }
    },

    "Acne": {
        description: "Experiencing breakouts or pimples on the skin, often due to hormonal changes.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Maintain a consistent skincare routine that includes gentle cleansing and moisturizing.",
            "Avoid picking or squeezing pimples, as this can lead to scarring and further breakouts.",
            "Consider using over-the-counter acne treatments that contain ingredients like benzoyl peroxide or salicylic acid. If acne is severe or persistent, consult a dermatologist for personalized treatment options.",
        ],
        shoppingList: [
            "Gentle cleanser",
            "Moisturizer",
            "Acne treatment (benzoyl peroxide or salicylic acid)"
        ],
        phaseReasons: {
            Menstrual: "The hormonal imbalance in menstruation can trigger breakouts.",
            Follicular: "Skin may start to clear up as hormone levels stabilize after menstruation.",
            Ovulation: "High estrogen levels can lead to clearer skin, but some individuals may still experience breakouts due to hormonal fluctuations.",
            Luteal: "As progesterone levels rise in the luteal phase, it can increase oil production in the skin, leading to clogged pores and acne breakouts."
        }
    },

    "Nausea": {
        description: "Feeling queasy or experiencing an upset stomach, which can sometimes lead to vomiting.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Eat small, frequent meals to help manage nausea and avoid an empty stomach.",
            "Ginger tea or ginger supplements may help alleviate nausea for some individuals.",
            "Stay hydrated and consider using over-the-counter anti-nausea medications if necessary. If nausea is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Ginger tea",
            "Anti-nausea medications",
            "Hydrating beverages"
        ],
        phaseReasons: {
            Menstrual: "Hormones and cramps can contribute to nausea during menstruation.",
            Follicular: "It's less common in the follicular phase, however, some individuals may still experience nausea due to hormonal fluctuations.",
            Ovulation: "Hormonal shifts may trigger nausea, but it's typically less intense than during menstruation.",
            Luteal: "Progesterone can slow down digestion, which may contribute to feelings of nausea in the luteal phase, especially as the body prepares for menstruation."
        }
    },

    "Joint pain": {
        description: "Experiencing discomfort or pain in the joints, which can range from mild to severe.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Gentle stretching and low-impact exercises, such as yoga or swimming, may help alleviate joint pain for some individuals.",
            "Omega-3 fatty acids, found in fish oil supplements, may help reduce inflammation and joint pain.",
            "Over-the-counter pain relievers, such as ibuprofen, can be effective for managing joint pain. If joint pain is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Omega-3 supplements",
            "Ibuprofen",
            "Epsom salt"
        ],
        phaseReasons: {
            Menstrual: "The inflammation associated with menstruation can sometimes lead to joint pain.",
            Follicular: "As hormones stabilize after menstruation, joint pain may improve for some individuals.",
            Ovulation: "Hormonal changes during ovulation can sometimes cause mild joint pain.",
            Luteal: "Fluid retention can cause swelling and discomfort in the joints during the luteal phase."
        }
    },

    "Ovulation pain": {
        description: "Experiencing mild to moderate pain or discomfort on one side of the lower abdomen, often occurring around the time of ovulation.",
        typicalCyclePhase: "Ovulation",
        tips: [
            "Applying heat to the lower abdomen can help relieve ovulation pain.",
            "Ovulatory pain is usually temporary and may resolve on its own within a day or two. If the pain is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
            "Consider tracking your ovulation pain in a symptom diary to identify patterns and better understand your cycle.",
        ],
        shoppingList: [
            "Warm compress",
            "Pain relievers",
            "Hydrating beverages"
        ],
        phaseReasons: {
            Menstrual: "It's not present during menstuation and is more likely to be confused with menstrual cramps.",
            Follicular: "Developing follicles can cause mild discomfort, but true ovulation pain is typically associated with the release of the egg.",
            Ovulation: "Releasing an egg can cause mild to moderate pain due to the follicle rupturing and hormonal changes.",
            Luteal: "After ovulation, the pain usually subsides, but some individuals may still experience mild discomfort as the body adjusts to hormonal changes."
        }
    },

    "Insomnia": {
        description: "Difficulty falling asleep, staying asleep, or experiencing non-restorative sleep.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Establish a consistent sleep schedule by going to bed and waking up at the same time each day.",
            "Create a relaxing bedtime routine, such as reading or taking a warm bath, to signal to your body that it's time to sleep.",
            "Limit exposure to screens and bright lights before bedtime, as they can interfere with your body's natural sleep-wake cycle. If insomnia persists, consider consulting a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Herbal tea",
            "Caffine-free beverages",
            "Sleep aids (consult a healthcare professional before use)"
        ],
        phaseReasons: {
            Menstrual: "Discomfort from cramps and hormonal fluctuations can contribute to insomnia during menstruation.",
            Follicular: "Insomnia is less common during the follicular phase, but some individuals may still experience sleep disturbances due to hormonal changes.",
            Ovulation: "The higher energy levels of ovulation, casued by increased hormone production, can sometimes interfere with sleep.",
            Luteal: "Progestrone can cause drowsiness, but the drop in progesterone and estrogen levels in the late luteal phase can lead to insomnia and sleep disturbances."
        }
    },

    "Bloating": {
        description: "Feeling of fullness, tightness, or swelling in the abdomen, often due to gas or water retention.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Limit intake of salty foods, as they can contribute to water retention and bloating.",
            "Engage in regular physical activity, as it can help reduce bloating and improve digestion.",
            "Drink plenty of water to help flush out excess sodium and reduce bloating. If bloating is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Low-salt foods",
            "Hydrating beverages",
            "Digestive aids"
        ],
        phaseReasons: {
            Menstrual: "Inflammation and hormonal changes during menstruation can contribute to bloating.",
            Follicular: "Digestion tends to improve, but some individuals may still experience bloating as the body adjusts after menstruation.",
            Ovulation: "Mild bloating can occur during ovulation due to hormonal changes, but it's typically less intense than in the luteal phase.",
            Luteal: "Progesterone can slow digestion as relaxes the muscles of the digestive track which reduces the speed at which food moves through the digestive system, leading to increased water retention and bloating."
        }
    },

    "Gas": {
        description: "The presence of excess air or gas in the digestive system, which can cause discomfort and bloating.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Avoid foods that are known to cause gas, such as beans, lentils, carbonated drinks, and certain vegetables like broccoli and cabbage.",
            "Eat slowly and chew your food thoroughly to reduce the amount of air you swallow, which can contribute to gas.",
            "Light walking after meals can help stimulate digestion and reduce gas. If gas is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Gas relief medications",
            "Digestive aids",
            "Probiotics"
        ],
        phaseReasons: {
            Menstrual: "Hormonal changes during menstruation can affect digestion and contribute to gas.",
            Follicular: "Digestion tends to improve, but some individuals may still experience gas as the body adjusts after menstruation.",
            Ovulation: "Mild gas can occur during ovulation due to hormonal changes, but it's typically less intense than in the luteal phase.",
            Luteal: "Progesterone can slow digestion, which may lead to increased gas and bloating."
        }
    },

    "Diarrhea": {
        description: "Experiencing loose, watery stools that may occur more frequently than usual.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Stay hydrated by drinking plenty of fluids, such as water and electrolyte solutions, to prevent dehydration.",
            "Avoid foods that can irritate the digestive system, such as spicy foods, caffeine, and dairy products.",
            "Consider eating bland, easy-to-digest foods like bananas, rice, applesauce, and toast (the BRAT diet) until symptoms improve. If diarrhea is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Oral rehydration solutions",
            "BRAT diet foods (bananas, rice, applesauce, toast)",
            "Electrolyte drinks"
        ],
        phaseReasons: {
            Menstrual: "Prostaglandins released during menstruation can stimulate the intestines, leading to diarrhea for some individuals.",
            Follicular: "At the beginning of the follicular phase, digestion may still be affected by hormonal changes, but diarrhea is less common than during menstruation.",
            Ovulation: "Mild diarrhea can occur during ovulation due to hormonal changes, but it's typically less intense than in the luteal phase.",
            Luteal: "As progesterone peaks and then drops, and prostaglandins rise, these hormonal shifts can lead to gastrointestinal issues, including diarrhea."
        }
    },

    "Constipation": {
        description: "Difficulty passing stools or infrequent bowel movements, often accompanied by hard or dry stools.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Increase your intake of dietary fiber by consuming more fruits, vegetables, whole grains, and legumes.",
            "Drink plenty of water to help soften stools and promote regular bowel movements.",
            "Engage in regular physical activity, as it can help stimulate digestion and alleviate constipation. If constipation is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Fruits and vegetables",
            "Whole grain-based foods",
            "Legumes"
        ],
        phaseReasons: {
            Menstrual: "Due to hormonal fluctuations, some individuals may experience constipation during menstruation, but it's less common than diarrhea.",
            Follicular: "A rise in progesterone can slow down digestion, which may lead to constipation for some individuals during the follicular phase.",
            Ovulation: "As progesterone spikes after ovulation, it can slow digestion and lead to constipation for some individuals.",
            Luteal: "Due to the high levels of progesterone in the luteal phase, digestion can slow down significantly, leading to constipation for many individuals."
        }
    },

    "Low appetite": {
        description: "Experiencing a reduced desire to eat or lack of interest in food.",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "Eat small, frequent meals that are nutrient-dense to ensure you're getting the necessary nutrients even if your appetite is low.",
            "Focus on foods that are easy to digest and appealing to you, such as smoothies, soups, or yogurt.",
            "Drink plenty of fluids to stay hydrated, especially if you're not eating as much. If low appetite persists or is accompanied by other concerning symptoms, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Smoothies",
            "Soups",
            "Yogurt",
        ],
        phaseReasons: {
            Menstrual: "Pain and hormones could potentially reduce appetite.",
            Follicular: "Estrogen increases in the follicualr ahse and estrogen is known to suppress appetite.",
            Ovulation: "Not as common during ovulation, but some individuals may experience a temporary decrease in appetite due to hormonal fluctuations.",
            Luteal: "Appetite can very widely affected by the hormonal changes in the luteal phase, with some individuals experiencing a decrease in appetite due to progesterone's effects on the digestive system and mood."
        }
    },

    "Increased appetite": {
        description: "Experiencing a heightened desire to eat or increased interest in food.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Focus on consuming nutrient-dense foods that provide essential vitamins and minerals, rather than empty calories.",
            "Practice mindful eating by paying attention to hunger and fullness cues, and try to avoid emotional eating.",
            "Engage in regular physical activity to help manage increased appetite and maintain a healthy weight. If increased appetite is severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Fruits",
            "Vegetables",
            "Whole grain-based snacks",
            
        ],
        phaseReasons: {
            Menstrual: "The body requires more energy to manage menstruation and it",
            Follicular: "As the follicular phases progresses, rising estrogen levels can suppress appetite, but some individuals may still experience an increase in appetite as the body recovers from menstruation.",
            Ovulation: "Not as common during ovulation, but some individuals may experience a temporary increase in appetite due to hormonal fluctuations.",
            Luteal: "High levels of progesterone can increase appetite and cravings, especially for carbohydrates, as the body prepares for a potential pregnancy."
        }
    },

    "Chocolate cravings": {
        description: "Experiencing a strong desire to eat chocolate, which may be due to hormonal changes or nutrient deficiencies.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Allow yourself to enjoy chocolate in moderation, as it can provide a temporary mood boost and satisfy cravings.",
            "Consider healthier alternatives to chocolate, such as dark chocolate with a high cocoa content, which may provide more nutritional benefits and less sugar.",
            "A magnesium deficiency can sometimes contribute to chocolate cravings, so consider incorporating magnesium-rich foods like nuts, seeds, and leafy greens into your diet. If chocolate cravings are severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Dark chocolate",
            "Magnesium-rich foods",
            "Low sugar chocolate alternatives"
        ],
        phaseReasons: {
            Menstrual: "Cravings for chocolate are common for comfort and energy replenishment.",
            Follicular: "Chocolate cravings are less intense but can still occur as the body recovers from menstruation.",
            Ovulation: "Chocolate cravings are not typically associated with ovulation but can still occur due to hormonal fluctuations.",
            Luteal: "Chocolate cravings are common as low serotonin levels can prompt cravings for chocolate, which can temporarily boost serotonin levels and improve mood during the luteal phase."
        }
    },

    "Salty cravings": {
        description: "Experiencing a strong desire to eat salty foods, which may be due to hormonal changes or electrolyte imbalances.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Allow yourself to enjoy salty foods in moderation, but try to choose healthier options like nuts, seeds, or lightly salted popcorn.",
            "Focus on staying hydrated, as sometimes salty cravings can be a sign of dehydration.",
            "Consider incorporating electrolyte-rich foods, such as fruits, vegetables, and dairy products, into your diet to help balance your electrolyte levels. If salty cravings are severe or persistent, consult a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: [
            "Nuts",
            "Seeds",
            "Lightly salted snacks"
        ],
        phaseReasons: {
            Menstrual: "Salty cravings are common as hormonal shifts can cause increased water retention andfluid balance issues, requiring sodium-heavy snacks.",
            Follicular: "Salty cravings are less intense here, but can still occur as the body recovers from menstruation and hormonal levels adjust.",
            Ovulation: "There are minimal salty cravings during ovulation, but they can still occur due to hormonal fluctuations.",
            Luteal: "A drop in serotonin levels can prompt cravings for salty foods, which can temporarily boost serotonin levels and improve mood during the luteal phase."
        }
    },

    "Watery": {
        description: "Thin, watery cervical mucus",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "This type of mucus is a sign of fertility, so it can be a good time to try to conceive if that's your goal.",
            "Maintain good hygiene to prevent infections, as watery mucus can sometimes be associated with increased vaginal discharge.",
            "Ovulation is approaching, so you may want to track your cycle closely if you're trying to conceive or avoid pregnancy.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Watery discharge is less common during the menstruation phase, but some individuals may experience it as the body sheds the uterine lining.",
            Follicular: "As estrogen levels rise during the follicular phase, it stimulates the production of watery cervical mucus, which is a sign of fertility.",
            Ovulation: "At your peak fertility during ovulation, you may notice an increase in watery cervical mucus, which helps sperm travel through the cervix to fertilize an egg.",
            Luteal: "As progesterone levels rise in the luteal phase, cervical mucus typically becomes thicker and less watery, which can make it less conducive to sperm movement."
        }
    },

    "Egg white": {
        description: "Clear, stretchy cervical mucus that resembles raw egg whites",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is the most fertile type of cervical mucus, so it's a prime time for conception if that's your goal.",
            "Maintain good hygiene to prevent infections, as egg white mucus can sometimes be associated with increased vaginal discharge.",
            "Ovulation is occurring, so you may want to track your cycle closely if you're trying to conceive or avoid pregnancy.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Egg white cervical mucus is not typically present during menstruation, as the body is shedding the uterine lining and hormone levels are low.",
            Follicular: "As estrogen levels increase, egg white cervical mucus may start to appear as the body prepares for ovulation, but it's typically more common in the later follicular phase.",
            Ovulation: "During ovulation, egg white cervical mucus is at its peak, providing the most favorable conditions for sperm to travel and fertilize an egg.",
            Luteal: "In the luteal phase, hormone levels change, causing cervical mucus to become thicker and less receptive to sperm."
        }
    },

    "Creamy": {
        description: "Smooth, lotion-like cervical mucus that is usually white or cloudy",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "This type of mucus is not as fertile as watery or egg white mucus.",
            "Maintain good hygiene to prevent infections, as creamy mucus can sometimes be associated with increased vaginal discharge.",
            "Monitor your cycle closely, as you may be approaching ovulation if you notice a transition from creamy to watery or egg white mucus.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Creamy discharge is minimal, however some individuals may experience it as the body sheds the uterine lining and hormone levels fluctuate.",
            Follicular: "As estrogen levels rise during the follicular phase, creamy cervical mucus may appear, indicating increasing fertility.",
            Ovulation: "During ovulation, creamy mucus may still be present, but it's typically less abundant than watery or egg white mucus.",
            Luteal: "In the luteal phase, progesterone can cause cervical mucus to become thicker and creamier, which is less conducive to sperm movement and indicates that fertility is decreasing."
        }
    },

    "Sticky": {
        description: "Thick, sticky cervical mucus that is usually white or cloudy",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This type of mucus is less fertile, so it's less likely to support conception if that's your goal.",
            "Maintain good hygiene to prevent infections, as sticky mucus can sometimes be associated with increased vaginal discharge.",
            "If you're trying to avoid pregnancy, be aware that sticky mucus is a sign that fertility is decreasing."
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Sticky cervial msucus is common right after menstruation, which is a sign of low fertility.",
            Follicular: "Sticky discharge is very common earlier in the follicular phase, as fertility is low and hormons begin to rise.",
            Ovulation: "Sticky mucus may still be present during ovulation, but it's typically less abundant than watery or egg white mucus.",
            Luteal: "In the luteal phase, progesterone can cause cervical mucus to become thicker and more sticky, which is less conducive to sperm movement and indicates that fertility is decreasing."
        }
    },

    "Clumpy white": {
        description: "Thick white mucus that resembles cottage cheese",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This type of mucus is often a sign of a yeast infection, so consider consulting a healthcare professional for evaluation and treatment if you notice this type of mucus.",
            "Maintain good hygiene and avoid irritants, such as scented products or tight clothing, to help prevent yeast infections.",
            "Can usually mean a normal hormonal change",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Clumpy white discharge is rare but could be a sign of an infection or hormonal imbalance during menstruation.",
            Follicular: "A possible hormonal imbalance or infection could cause clumpy white discharge during the follicular phase, but it's not typically associated with normal hormonal changes.",
            Ovulation: "Clumpy white discharge is not typically associated with ovulation.",
            Luteal: "In the luteal phase, clumpy white discharge can occur due to the increase in progesterone levels."
        }

    },

    "Brown": {
        description: "Brown cervical mucus or discharge",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "This is often old blood being expelled from the uterus, so it's usually not a cause for concern.",
            "Maintain good hygiene during this time, as brown discharge can sometimes be associated with increased vaginal discharge.",
            "If you notice a sudden change in the amount or color of your discharge, or if you experience other symptoms like itching or a foul odor, consider consulting a healthcare professional for further evaluation.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Brown discharge during the menstrual phase is usually old blood being expelled from the uterus.",
            Follicular: "Brown discharge could be potential spotting from the previous menstrual cycle, but it's less common during the follicular phase.",
            Ovulation: "Ovulation spotting can sometimes cause brown discharge, but it's typically light and not as common as during menstruation.",
            Luteal: "Pre-period spotting can sometimes cause brown discharge in the luteal phase, but it's typically light and not as common as during menstruation."
        }
    },

    "Pink": {
        description: "Pink cervical mucus or discharge",
        typicalCyclePhase: "Ovulation or spotting",
        tips: [
            "Pink mucus can sometimes be a sign of ovulation, so it can be a good time to try to conceive if that's your goal.",
            "Indicates that a small amount of blood is present, which can be normal during ovulation or as spotting between periods.",
            "Maintain good hygiene during this time, as pink discharge can sometimes be associated with increased vaginal discharge.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Pink discharge could be a sign of light bleeding or spotting during menstruation, but it's typically more common to see red or brown discharge during this phase.",
            Follicular: "Light spotting after menstruation can sometimes cause pink discharge during the follicular phase, but it's less common than during menstruation.",
            Ovulation: "Pink discharge can sometimes be a sign of ovulation, indicating the presence of a small amount of blood.",
            Luteal: "Pink discharge in the luteal phase can sometimes occur due to implantation bleeding or other hormonal changes."
        }
    },

    "High": {
        description: "High energy levels, feeling lively and active",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is a great time to engage in physical activities that you enjoy, such as working out or outdoor activities.",
            "Consider scheduling social events or important tasks during this phase when you may feel more energetic.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your energy levels.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Energy may begin to return after rest",
            Follicular: "The rise in estrogen can boost energy levels and improve mood, leading to feelings of being energized.",
            Ovulation: "This is the peak of energy due to high estrogen levels, which can enhance mood and increase feelings of vitality.",
            Luteal: "In the early luteal phase, you may still feel some of the energizing effects of estrogen before progesterone levels rise and potentially cause fatigue."
        }
    },

    "Medium": {
        description: "Moderate energy levels, feeling somewhat active but not overly energetic",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "This is a good time to focus on tasks that require moderate energy and concentration.",
            "Engage in activities that you enjoy and that help you relax, such as hobbies or spending time with friends.",
            "Maintain a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your energy levels.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "As the body recovers from menstruation, energy levels may start to improve, but they may still be moderate due to lingering fatigue and hormonal fluctuations.",
            Follicular: "The rise in estrogen can boost energy levels and improve mood, leading to feelings of being energized, so a moderate energy level is common during this phase as the body adjusts after menstruation.",
            Ovulation: "TEven though energy levels tend to be high, some individuals may experience moderate energy levels during ovulation due to hormonal fluctuations and individual differences in how they respond to these changes.",
            Luteal: "In the early luteal phase, you may still feel some of the energizing effects of estrogen before progesterone levels rise and potentially cause fatigue."
        }

    },

    "Low": {
        description: "Low energy levels, feeling tired or fatigued",
        typicalCyclePhase: "Menstrual phase or Luteal phase",
        tips: [
            "This is a good time to rest and prioritize self-care.",
            "Engage in gentle activities that don't deplete your energy, such as reading or taking a warm bath.",
            "Maintain a healthy lifestyle, including regular sleep patterns and a balanced diet, to help sustain your energy levels.",
        ],
        shoppingList: [
            "Comfort foods",
            "Coffee",
            "Energy drinks (in moderation)"
        ],
        phaseReasons: {
            Menstrual: "Blood loss and low hormone levels during menstruation can contribute to feelings of exhaustion.",
            Follicular: "The body is recovering from menstruation some individuals may still feel tired, but energy levels typically start to improve as estrogen rises.",
            Ovulation: "Energy levels can dip after the peak of ovulation due to hormonal fluctuations, but many individuals still feel energized during this phase.",
            Luteal: "Progesterone increase can cause fatigue and lower energy levels, especially in the later luteal phase leading up to menstruation."
        }
    },

    "High libido": {
        description: "Increased sexual desire or interest",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is a great time to connect with your partner and explore your sexuality if you feel comfortable doing so.",
            "Consider scheduling intimate time with your partner during this phase when you may feel more sexually interested.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your libido.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "As the period ends, some individuals may experience a return of sexual desire, but it's typically lower than during other phases due to hormonal fluctuations and physical discomfort.",
            Follicular: "Rising hormones can increase libido, but it's typically not at its peak until ovulation.",
            Ovulation: "This is the peak of sexual desire as the body is most fertile, and high estrogen levels can enhance libido and increase feelings of sexual interest.",
            Luteal: "At the start of the luteal phase, you may still feel some of the energizing effects of estrogen, but as progesterone levels rise, libido may decrease for many individuals."
        }
    },

    "Low libido": {
        description: "Decreased sexual desire or interest",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This is a good time to focus on self-care and maintaining a healthy lifestyle.",
            "Consider communicating with your partner about your feelings and needs.",
            "Engage in activities that help you relax and reduce stress.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Discomfort due to cramps and other pains in menstruation may reduce sexual desire.",
            Follicular: "At the beginning of the follicular phase, libido may still be low as the body recovers from menstruation, but it typically starts to increase as estrogen levels rise.",
            Ovulation: "It's less common to have a low libido during ovulation, but some individuals may experience it due to hormonal fluctuations or individual differences in how they respond to these changes.",
            Luteal: "Hormonal drops, such as the decrease in estrogen and the increase in progesterone, can lead to a decrease in libido for many individuals during the luteal phase."
        }
    },

    "Solo": {
        description: "Engaging in solo sexual activities, such as masturbation.",
        typicalCyclePhase: "Any",
        tips: [
            "Solo sexual activities can be a healthy way to explore your body and experience pleasure, regardless of your cycle phase.",
            "Consider setting aside time for self-care and self-exploration, and remember that it's normal to have varying levels of sexual desire throughout your cycle.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Protected": {
        description: "Engaging in sexual activities with the use of protection, such as condoms or other barrier methods.",
        typicalCyclePhase: "Any",
        tips: [
            "Using protection during sexual activities can help prevent sexually transmitted infections and unintended pregnancies, regardless of your cycle phase.",
            "Consider discussing sexual health and contraception options with your partner to ensure that you're both on the same page.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Unprotected": {
        description: "Engaging in sexual activities without the use of protection.",
        typicalCyclePhase: "Any",
        tips: [
            "Engaging in unprotected sexual activities can increase the risk of sexually transmitted infections and unintended pregnancies, so it's important to be aware of these risks and take appropriate precautions.",
            "Consider discussing sexual health and contraception options with your partner to ensure that you're both on the same page.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null,
        phaseReasons: null
    },


    "Meditation": {
        description: "Engaging in mindfulness meditation to promote relaxation and mental well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "Set aside time each day for meditation, even if it's just a few minutes.",
            "Find a quiet and comfortable space where you can focus without distractions.",
            "Use guided meditation apps or videos if you're new to meditation and want some structure to follow.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Running": {
        description: "Engaging in running or jogging as a form of cardiovascular exercise.",
        typicalCyclePhase: "Follicular phase or Ovulation",
        tips: [
            "Running may feel easier and more enjoyable during the follicular phase and ovulation due to higher energy levels and improved mood.",
            "Make sure to stay hydrated and listen to your body, especially if you're running during the menstrual phase or luteal phase when energy levels may be lower.",
            "Consider incorporating interval training or varying your running routes to keep things interesting and maintain motivation.",
        ],
        shoppingList: null,
        phaseReasons: null
        
    },

    "Cardio": {
        description: "Engaging in cardiovascular exercises, such as cycling, swimming, or aerobic classes.",
        typicalCyclePhase: "Follicular phase or Ovulation",
        tips: [
            "Cardiovascular exercises may feel more enjoyable and effective during the follicular phase and ovulation due to higher energy levels and improved mood.",
            "Make sure to stay hydrated and listen to your body, especially if you're engaging in cardio during the menstrual phase or luteal phase when energy levels may be lower.",
            "Consider trying different types of cardio exercises to keep things interesting and maintain motivation.",
        ],
        shoppingList: null,
        phaseReasons: null
    },
    
    "Yoga": {
        description: "Engaging in yoga practice to promote flexibility, strength, and mental well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "During the menstrual phase, focus on gentle and restorative yoga poses to help alleviate cramps and promote relaxation.",
            "During the follicular phase and ovulation, you may feel more energetic and can incorporate more dynamic and challenging poses into your practice.",
            "During the luteal phase, listen to your body and adjust your practice as needed, focusing on poses that help reduce stress and promote relaxation.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Weights": {
        description: "Engaging in strength training exercises using weights or resistance.",
        typicalCyclePhase: "Any",
        tips: [
            "Strength training can be beneficial at any time during your cycle, but you may feel more motivated and powerful during the follicular phase and ovulation.",
            "Make sure to warm up properly and use correct form to prevent injury.",
            "Consider working with a trainer or experienced friend to help you with your strength training routine.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Dancing": {
        decription: "Engaging in dance as a form of physical activity and self-expression.",
        typicalCyclePhase: "Any",
        tips: [
            "Dancing can be a fun and enjoyable way to stay active, regardless of your cycle phase.",
            "Consider taking a dance class or following online dance workouts to learn new moves and keep things interesting.",
            "Use dancing as a way to boost your mood and connect with your body, especially during times when you may be feeling low or stressed.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Relaxing": {
        description: "Engaging in activities that promote relaxation and reduce stress.",
        typicalCyclePhase: "Any",
        tips: [
            "Set aside time each day for relaxation, whether it's through meditation, deep breathing exercises, or simply taking a break from your routine.",
            "Find activities that help you unwind and bring you joy, such as reading, listening to music, or spending time in nature.",
            "Consider creating a relaxing environment at home with calming scents, soft lighting, and comfortable spaces to help you relax.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Reading": {
        description: "Engaging in reading as a form of mental stimulation and relaxation.",
        typicalCyclePhase: "Any",
        tips: [
            "Choose books that interest you and bring you joy, whether they're fiction, non-fiction, or self-help.",
            "Set aside dedicated time for reading each day, even if it's just a few minutes before bed.",
            "Consider joining a book club or discussing books with friends to add a social element to your reading experience.",
        ],
        shoppingList: null,
        phaseReasons: null
    },


    "Napping": {
        description: "Taking short naps during the day to help recharge and improve alertness.",
        typicalCyclePhase: "Menstrual phase or Luteal phase",
        tips: [
            "Short naps of 20-30 minutes can help improve mood and energy levels, especially during the menstrual phase or luteal phase when fatigue may be more common.",
            "Find a quiet and comfortable space for napping, and try to nap earlier in the day to avoid interfering with nighttime sleep.",
            "Listen to your body and allow yourself to rest when you need it, without guilt or judgment.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Walking": {
        description: "Engaging in walking as a form of low-impact physical activity.",
        typicalCyclePhase: "Any",
        tips: [
            "Walking can be a great way to stay active and clear your mind, regardless of your cycle phase.",
            "Consider taking walks in nature or around your neighborhood to enjoy the outdoors and boost your mood.",
            "Use walking as a way to connect with friends or family by going for walks together.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Travel": {
        description: "Travelling such as flights and long car rides can disrupt your routine and cause stress.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have a trip planned, try to schedule it during a time when you typically feel more energetic and less symptomatic, such as the follicular phase or ovulation.",
            "Make sure to stay hydrated, get plenty of rest, and pack any necessary medications or comfort items to help manage symptoms while traveling.",
            "Consider using travel as an opportunity to relax and recharge, rather than adding stress to your routine.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Illness": {
        description: "Experiencing illness or health issues that can impact your daily life and well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're feeling unwell, prioritize rest and self-care to help your body recover.",
            "Make sure to stay hydrated and eat nourishing foods to support your immune system.",
            "Consider consulting a healthcare professional if your illness is severe or persistent, or if you have any concerns about your symptoms.",
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Illness can exacerbate symptoms during menstruation, such as fatigue and cramps.",
            Follicular: "Immunity tends to be stronger during the follicular phase, but illness can still impact energy levels and overall well-being.",
            Ovulation: "Hormonal changes during ovulation may affect how your body responds to illness, potentially leading to increased symptoms.",
            Luteal: "The luteal phase can sometimes be associated with a weakened immune response, making it more likely for illness to impact your symptoms and energy levels during this time."
        }
    },

    "Stress": {
        description: "Experiencing stress or anxiety that can impact your mental and physical well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "Practice stress-management techniques, such as deep breathing exercises, meditation, or yoga, to help reduce stress levels.",
            "Engage in activities that bring you joy and help you relax, such as hobbies, spending time with loved ones, or being in nature.",
            "Consider seeking support from a trusted friend, counselor, or therapist if you're feeling overwhelmed by stress.", 
        ],
        shoppingList: null,
        phaseReasons: {
            Menstrual: "Stress can exacerbate symptoms during menstruation, such as cramps and fatigue.",
            Follicular: "While the follicular phase can be a time of increased energy, stress can still impact your mood and overall well-being during this phase.",
            Ovulation: "The increased social energy during ovulation may increase pressure.",
            Luteal: "The luteal phase can sometimes be associated with increased sensitivity to stress due to hormonal fluctuations, which may exacerbate symptoms and impact overall well-being during this time."
        }
    },

    "Sleep Disruption": {
        description: "Experiencing difficulty falling asleep, staying asleep, or having non-restorative sleep.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Establish a consistent sleep schedule by going to bed and waking up at the same time each day.",
            "Create a relaxing bedtime routine, such as reading or taking a warm bath, to signal to your body that it's time to sleep.",
            "Limit exposure to screens and bright lights before bedtime, as they can interfere with your body's natural sleep-wake cycle. If sleep disruption persists, consider consulting a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Medication Change": {
        description: "Experiencing changes in symptoms or side effects due to starting, stopping, or changing medications.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're experiencing changes in symptoms due to medication changes, it's important to communicate with your healthcare provider about any concerns or side effects you're experiencing.",
            "Make sure to follow your healthcare provider's instructions regarding medication use, and don't hesitate to ask questions or seek clarification if you're unsure about anything.",
            "Consider keeping a symptom diary to track any changes in symptoms or side effects related to medication changes, which can help you and your healthcare provider make informed decisions about your treatment plan.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "None": {
        description: "No birth control method used.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're not using any birth control method, it's important to be aware of your fertility and take appropriate precautions if you're trying to avoid pregnancy.", 
            "Consider tracking your menstrual cycle and fertility signs to better understand your reproductive health and make informed decisions about family planning.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to support your overall well-being and reproductive health.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Pill": {
        description: "Using oral contraceptive pills to prevent pregnancy.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using oral contraceptive pills, make sure to take them consistently and as directed by your healthcare provider to ensure their effectiveness.",
            "Be aware of potential side effects of oral contraceptive pills, such as changes in mood, weight, or menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider using a reminder system, such as an alarm or a pill organizer, to help you remember to take your pills at the same time each day.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Missed Pill": {
        description: "Forgetting to take one or more doses of oral contraceptive pills.",
        typicalCyclePhase: "Any",
        tips: [
            "If you miss a pill, refer to the instructions provided with your specific brand of oral contraceptive pills for guidance on what to do next, as recommendations may vary based on the number of pills missed and the timing within your cycle.",
            "Consider using a backup method of contraception, such as condoms, if you miss a pill and are concerned about the risk of pregnancy.",
            "If you have any questions or concerns about missed pills or your contraceptive method, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },
   

    "IUD": {
        description: "Using an intrauterine device (IUD) for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have an IUD, it's important to check the strings regularly to ensure that the device is in place and functioning properly.",
            "Be aware of potential side effects of IUDs, such as changes in menstrual bleeding or cramping, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to ensure that your IUD is still in place and to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Implant": {
        description: "Using a contraceptive implant for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have a contraceptive implant, it's important to be aware of potential side effects, such as changes in menstrual bleeding or mood, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to ensure that your implant is still in place and to address any questions or concerns you may have about your contraceptive method.",
            "If you're considering getting a contraceptive implant, make sure to discuss the benefits and potential side effects with your healthcare provider to determine if it's the right choice for you.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Injection": {
        description: "Using a contraceptive injection for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive injection, make sure to receive the injection on schedule, as recommended by your healthcare provider, to ensure its effectiveness.",
            "Be aware of potential side effects of contraceptive injections, such as changes in menstrual bleeding or mood, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Patch": {
        description: "Using a contraceptive patch for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive patch, make sure to apply it to clean, dry skin on the upper arm, torso, or buttocks, and follow the schedule recommended by your healthcare provider for changing the patch.",
            "Be aware of potential side effects of contraceptive patches, such as skin irritation or changes in menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Ring": {
        description: "Using a contraceptive vaginal ring for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive vaginal ring, make sure to insert it correctly and follow the schedule recommended by your healthcare provider for changing the ring.",
            "Be aware of potential side effects of contraceptive vaginal rings, such as vaginal irritation or changes in menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Condoms": {
        description: "Using condoms as a barrier method of contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using condoms, make sure to use them consistently and correctly to ensure their effectiveness in preventing pregnancy and reducing the risk of sexually transmitted infections.",
            "Consider using a water-based or silicone-based lubricant with condoms to reduce the risk of breakage and increase comfort during sexual activity.",
            "If you have any questions or concerns about using condoms or other contraceptive methods, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Other": {
        description: "Using other forms of contraception or birth control methods.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive method that isn't listed here, make sure to follow the instructions provided by your healthcare provider or the manufacturer to ensure its effectiveness.",
            "Be aware of potential side effects of your chosen contraceptive method, and communicate with your healthcare provider if you have any concerns or experience any adverse effects.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method and to ensure that it's still the right choice for you.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Painkillers": {
        description: "Using painkillers, such as over-the-counter or prescription medications, to manage pain or discomfort.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using painkillers, make sure to follow the instructions provided by your healthcare provider or the medication label to ensure safe and effective use.",
            "Using painkillers can help manage symptoms such as menstrual cramps, headaches, or other types of pain that may occur during your cycle.",
            "If you have any questions or concerns about using painkillers or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Hormonal Medication": {
        description: "Using hormonal medications, such as birth control pills or hormone replacement therapy, to manage symptoms or regulate menstrual cycles.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using hormonal medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Hormonal medications can help manage symptoms such as irregular periods, heavy bleeding, or hormonal imbalances that may occur during your cycle.",
            "If you have any questions or concerns about using hormonal medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Antidepressants": {
        description: "Using antidepressant medications to manage symptoms of depression or anxiety that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antidepressants, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Antidepressants can help manage symptoms of depression or anxiety that may be related to hormonal changes during the menstrual cycle, such as premenstrual dysphoric disorder (PMDD).",
            "If you have any questions or concerns about using antidepressants or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Anti-Anxiety": {
        description: "Using anti-anxiety medications to manage symptoms of anxiety that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using anti-anxiety medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Anti-anxiety medications can help manage symptoms of anxiety that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using anti-anxiety medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Antipsychotics": {
        description: "Using antipsychotic medications to manage symptoms of psychosis or other mental health conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antipsychotic medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Antipsychotic medications can help manage symptoms of psychosis or other mental health conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using antipsychotic medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Antihistamines": {
        description: "Using antihistamine medications to manage symptoms of allergies or other conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antihistamines, make sure to follow the instructions provided by your healthcare provider or the medication label to ensure safe and effective use.",
            "Antihistamines can help manage symptoms of allergies or other conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using antihistamines or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "HRT": {
        description: "Using hormone replacement therapy (HRT) to manage symptoms of menopause or other hormonal imbalances.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using hormone replacement therapy, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Hormone replacement therapy can help manage symptoms of menopause or other hormonal imbalances, such as hot flashes, night sweats, or mood changes.",
            "If you have any questions or concerns about using hormone replacement therapy or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Benzos": {
        description: "Using benzodiazepine medications to manage symptoms of anxiety or other conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using benzodiazepine medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Benzo medications can help manage symptoms of anxiety or other conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using benzodiazepine medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Mood Stabilizers": {
        description: "Using mood stabilizer medications to manage symptoms of mood disorders that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using mood stabilizer medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Mood stabilizers can help manage symptoms of mood disorders that may be related to hormonal changes during the menstrual cycle, such as bipolar disorder or premenstrual dysphoric disorder (PMDD).",
            "If you have any questions or concerns about using mood stabilizer medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null

    },

    "Vitamins": {
        description: "Taking vitamins or supplements to support overall health and well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking vitamins or supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Certain vitamins and supplements, such as iron, magnesium, or vitamin B6, may be particularly beneficial during certain phases of the menstrual cycle to help manage symptoms or support overall health.",
            "If you have any questions or concerns about taking vitamins or supplements, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Magnesium": {
        description: "Taking magnesium supplements to help manage symptoms such as cramps, headaches, or mood changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking magnesium supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Magnesium can help manage symptoms such as cramps, headaches, or mood changes that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking magnesium supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Zinc": {
        description: "Taking zinc supplements to support immune function and overall health during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking zinc supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",   
            "Zinc can help support immune function and overall health during the menstrual cycle.",
            "If you have any questions or concerns about taking zinc supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Iron": {
        description: "Taking iron supplements to help manage symptoms of anemia or heavy menstrual bleeding during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking iron supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Iron can help manage symptoms of anemia or heavy menstrual bleeding that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking iron supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Omega 3": {
        description: "Taking omega-3 supplements to help manage symptoms such as cramps, inflammation, or mood changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking omega-3 supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Omega-3 can help manage symptoms such as cramps, inflammation, or mood changes that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking omega-3 supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Probiotics": {
        description: "Taking probiotic supplements to support gut health and overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking probiotic supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Probiotics can help support gut health and overall well-being during the menstrual cycle.",    
            "If you have any questions or concerns about taking probiotic supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Adaptogens": {
        description: "Taking adaptogenic supplements, such as ashwagandha or rhodiola, to help manage stress and support overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking adaptogenic supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Adaptogens can help manage stress and support overall well-being during the menstrual cycle.",
            "If you have any questions or concerns about taking adaptogenic supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    },

    "Protein Powder": {
        description: "Using protein powder supplements to support muscle recovery and overall health during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using protein powder supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Protein powder can help support muscle recovery and overall health during the menstrual cycle, especially if you're engaging in regular exercise.",
            "If you have any questions or concerns about using protein powder supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ], 
        shoppingList: null,
        phaseReasons: null
    },

    "Fiber Supplements": {
        description: "Using fiber supplements to support digestive health and overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using fiber supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Fiber supplements can help support digestive health and overall well-being during the menstrual cycle, especially if you're experiencing digestive symptoms such as bloating or constipation.",
            "If you have any questions or concerns about using fiber supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null,
        phaseReasons: null
    }

};