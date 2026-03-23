// TEMPORARY FILE FOR SYMPTOM INFO - TO BE REPLACED WITH FIREBASE DATA STRUCTURE

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


    },

    "Calm": {
        description: "Feeling relaxed, at ease, and emotionally stable.",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "Use this time to focus on self-care and relaxation techniques, such as meditation or yoga.",
            "Engage in activities that promote mental well-being, like reading or spending time in nature.",
            "Consider scheduling important tasks or social events during this phase when you may feel more emotionally balanced.",
        ],
        shoppingList: null
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
    },

    "Energised" : {
        description: "Feeling lively, active, and full of energy.",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is great time to workout or engage in physical activities that you enjoy.",
            "Consider scheduling social events or important tasks during this phase when you may feel more energetic.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your energy levels.",
        ],
        shoppingList: null
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
        ]

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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
            
        ]
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
        ]
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
        ]
    },

    "Watery": {
        description: "Thin, watery cervical mucus",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "This type of mucus is a sign of fertility, so it can be a good time to try to conceive if that's your goal.",
            "Maintain good hygiene to prevent infections, as watery mucus can sometimes be associated with increased vaginal discharge.",
            "Ovulation is approaching, so you may want to track your cycle closely if you're trying to conceive or avoid pregnancy.",
        ],
        shoppingList: null
    },

    "Egg white": {
        description: "Clear, stretchy cervical mucus that resembles raw egg whites",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is the most fertile type of cervical mucus, so it's a prime time for conception if that's your goal.",
            "Maintain good hygiene to prevent infections, as egg white mucus can sometimes be associated with increased vaginal discharge.",
            "Ovulation is occurring, so you may want to track your cycle closely if you're trying to conceive or avoid pregnancy.",
        ],
        shoppingList: null
    },

    "Creamy": {
        description: "Smooth, lotion-like cervical mucus that is usually white or cloudy",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "Ferility is increasing, but this type of mucus is not as fertile as watery or egg white mucus.",
            "Maintain good hygiene to prevent infections, as creamy mucus can sometimes be associated with increased vaginal discharge.",
            "Monitor your cycle closely, as you may be approaching ovulation if you notice a transition from creamy to watery or egg white mucus.",
        ],
        shoppingList: null
    },

    "Sticky": {
        description: "Thick, sticky cervical mucus that is usually white or cloudy",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This type of mucus is less fertile, so it's less likely to support conception if that's your goal.",
            "Maintain good hygiene to prevent infections, as sticky mucus can sometimes be associated with increased vaginal discharge.",
            "If you're trying to avoid pregnancy, be aware that sticky mucus is a sign that fertility is decreasing."
        ],
        shoppingList: null
    },

    "Clumpy white": {
        description: "Thick white mucus that resembles cottage cheese",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This type of mucus is often a sign of a yeast infection, so consider consulting a healthcare professional for evaluation and treatment if you notice this type of mucus.",
            "Maintain good hygiene and avoid irritants, such as scented products or tight clothing, to help prevent yeast infections.",
            "Can usually mean a normal hormonal change",
        ],
        shoppingList: null

    },

    "Brown": {
        description: "Brown cervical mucus or discharge",
        typicalCyclePhase: "Menstrual phase",
        tips: [
            "This is often old blood being expelled from the uterus, so it's usually not a cause for concern.",
            "Maintain good hygiene during this time, as brown discharge can sometimes be associated with increased vaginal discharge.",
            "If you notice a sudden change in the amount or color of your discharge, or if you experience other symptoms like itching or a foul odor, consider consulting a healthcare professional for further evaluation.",
        ],
        shoppingList: null
    },

    "Pink": {
        description: "Pink cervical mucus or discharge",
        typicalCyclePhase: "Ovulation or spotting",
        tips: [
            "Pink mucus can sometimes be a sign of ovulation, so it can be a good time to try to conceive if that's your goal.",
            "Indicates that a small amount of blood is present, which can be normal during ovulation or as spotting between periods.",
            "Maintain good hygiene during this time, as pink discharge can sometimes be associated with increased vaginal discharge.",
        ],
        shoppingList: null
    },

    "High": {
        description: "High energy levels, feeling lively and active",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is a great time to engage in physical activities that you enjoy, such as working out or outdoor activities.",
            "Consider scheduling social events or important tasks during this phase when you may feel more energetic.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your energy levels.",
        ],
        shoppingList: null
    },

    "Medium": {
        description: "Moderate energy levels, feeling somewhat active but not overly energetic",
        typicalCyclePhase: "Follicular phase",
        tips: [
            "This is a good time to focus on tasks that require moderate energy and concentration.",
            "Engage in activities that you enjoy and that help you relax, such as hobbies or spending time with friends.",
            "Maintain a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your energy levels.",
        ],
        shoppingList: null
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
        ]
    },

    "High libido": {
        description: "Increased sexual desire or interest",
        typicalCyclePhase: "Ovulation",
        tips: [
            "This is a great time to connect with your partner and explore your sexuality if you feel comfortable doing so.",
            "Consider scheduling intimate time with your partner during this phase when you may feel more sexually interested.",
            "Focus on self-care and maintaining a healthy lifestyle to sustain your libido.",
        ],
        shoppingList: null
    },

    "Low libido": {
        description: "Decreased sexual desire or interest",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "This is a good time to focus on self-care and maintaining a healthy lifestyle.",
            "Consider communicating with your partner about your feelings and needs.",
            "Engage in activities that help you relax and reduce stress.",
        ],
        shoppingList: null
    },

    "Solo": {
        description: "Engaging in solo sexual activities, such as masturbation.",
        typicalCyclePhase: "Any",
        tips: [
            "Solo sexual activities can be a healthy way to explore your body and experience pleasure, regardless of your cycle phase.",
            "Consider setting aside time for self-care and self-exploration, and remember that it's normal to have varying levels of sexual desire throughout your cycle.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null
    },

    "Protected": {
        description: "Engaging in sexual activities with the use of protection, such as condoms or other barrier methods.",
        typicalCyclePhase: "Any",
        tips: [
            "Using protection during sexual activities can help prevent sexually transmitted infections and unintended pregnancies, regardless of your cycle phase.",
            "Consider discussing sexual health and contraception options with your partner to ensure that you're both on the same page.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null
    },

    "Unprotected": {
        description: "Engaging in sexual activities without the use of protection.",
        typicalCyclePhase: "Any",
        tips: [
            "Engaging in unprotected sexual activities can increase the risk of sexually transmitted infections and unintended pregnancies, so it's important to be aware of these risks and take appropriate precautions.",
            "Consider discussing sexual health and contraception options with your partner to ensure that you're both on the same page.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to help sustain your overall well-being and sexual health.",
        ],
        shoppingList: null
    },


    "Meditation": {
        description: "Engaging in mindfulness meditation to promote relaxation and mental well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "Set aside time each day for meditation, even if it's just a few minutes.",
            "Find a quiet and comfortable space where you can focus without distractions.",
            "Use guided meditation apps or videos if you're new to meditation and want some structure to follow.",
        ],
        shoppingList: null
    },

    "Running": {
        description: "Engaging in running or jogging as a form of cardiovascular exercise.",
        typicalCyclePhase: "Follicular phase or Ovulation",
        tips: [
            "Running may feel easier and more enjoyable during the follicular phase and ovulation due to higher energy levels and improved mood.",
            "Make sure to stay hydrated and listen to your body, especially if you're running during the menstrual phase or luteal phase when energy levels may be lower.",
            "Consider incorporating interval training or varying your running routes to keep things interesting and maintain motivation.",
        ],
        shoppingList: null
        
    },

    "Cardio": {
        description: "Engaging in cardiovascular exercises, such as cycling, swimming, or aerobic classes.",
        typicalCyclePhase: "Follicular phase or Ovulation",
        tips: [
            "Cardiovascular exercises may feel more enjoyable and effective during the follicular phase and ovulation due to higher energy levels and improved mood.",
            "Make sure to stay hydrated and listen to your body, especially if you're engaging in cardio during the menstrual phase or luteal phase when energy levels may be lower.",
            "Consider trying different types of cardio exercises to keep things interesting and maintain motivation.",
        ],
        shoppingList: null
    },
    
    "Yoga": {
        description: "Engaging in yoga practice to promote flexibility, strength, and mental well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "During the menstrual phase, focus on gentle and restorative yoga poses to help alleviate cramps and promote relaxation.",
            "During the follicular phase and ovulation, you may feel more energetic and can incorporate more dynamic and challenging poses into your practice.",
            "During the luteal phase, listen to your body and adjust your practice as needed, focusing on poses that help reduce stress and promote relaxation.",
        ],
        shoppingList: null
    },

    "Weights": {
        description: "Engaging in strength training exercises using weights or resistance.",
        typicalCyclePhase: "Any",
        tips: [
            "Strength training can be beneficial at any time during your cycle, but you may feel more motivated and powerful during the follicular phase and ovulation.",
            "Make sure to warm up properly and use correct form to prevent injury.",
            "Consider working with a trainer or experienced friend to help you with your strength training routine.",
        ],
        shoppingList: null
    },

    "Dancing": {
        decription: "Engaging in dance as a form of physical activity and self-expression.",
        typicalCyclePhase: "Any",
        tips: [
            "Dancing can be a fun and enjoyable way to stay active, regardless of your cycle phase.",
            "Consider taking a dance class or following online dance workouts to learn new moves and keep things interesting.",
            "Use dancing as a way to boost your mood and connect with your body, especially during times when you may be feeling low or stressed.",
        ],
        shoppingList: null
    },

    "Relaxing": {
        description: "Engaging in activities that promote relaxation and reduce stress.",
        typicalCyclePhase: "Any",
        tips: [
            "Set aside time each day for relaxation, whether it's through meditation, deep breathing exercises, or simply taking a break from your routine.",
            "Find activities that help you unwind and bring you joy, such as reading, listening to music, or spending time in nature.",
            "Consider creating a relaxing environment at home with calming scents, soft lighting, and comfortable spaces to help you relax.",
        ],
        shoppingList: null
    },

    "Reading": {
        description: "Engaging in reading as a form of mental stimulation and relaxation.",
        typicalCyclePhase: "Any",
        tips: [
            "Choose books that interest you and bring you joy, whether they're fiction, non-fiction, or self-help.",
            "Set aside dedicated time for reading each day, even if it's just a few minutes before bed.",
            "Consider joining a book club or discussing books with friends to add a social element to your reading experience.",
        ],
        shoppingList: null
    },


    "Napping": {
        description: "Taking short naps during the day to help recharge and improve alertness.",
        typicalCyclePhase: "Menstrual phase or Luteal phase",
        tips: [
            "Short naps of 20-30 minutes can help improve mood and energy levels, especially during the menstrual phase or luteal phase when fatigue may be more common.",
            "Find a quiet and comfortable space for napping, and try to nap earlier in the day to avoid interfering with nighttime sleep.",
            "Listen to your body and allow yourself to rest when you need it, without guilt or judgment.",
        ],
        shoppingList: null
    },

    "Walking": {
        description: "Engaging in walking as a form of low-impact physical activity.",
        typicalCyclePhase: "Any",
        tips: [
            "Walking can be a great way to stay active and clear your mind, regardless of your cycle phase.",
            "Consider taking walks in nature or around your neighborhood to enjoy the outdoors and boost your mood.",
            "Use walking as a way to connect with friends or family by going for walks together.",
        ],
        shoppingList: null
    },

    "Travel": {
        description: "Travelling such as flights and long car rides can disrupt your routine and cause stress.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have a trip planned, try to schedule it during a time when you typically feel more energetic and less symptomatic, such as the follicular phase or ovulation.",
            "Make sure to stay hydrated, get plenty of rest, and pack any necessary medications or comfort items to help manage symptoms while traveling.",
            "Consider using travel as an opportunity to relax and recharge, rather than adding stress to your routine.",
        ],
        shoppingList: null
    },

    "Illness": {
        description: "Experiencing illness or health issues that can impact your daily life and well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're feeling unwell, prioritize rest and self-care to help your body recover.",
            "Make sure to stay hydrated and eat nourishing foods to support your immune system.",
            "Consider consulting a healthcare professional if your illness is severe or persistent, or if you have any concerns about your symptoms.",
        ],
        shoppingList: null
    },

    "Stress": {
        description: "Experiencing stress or anxiety that can impact your mental and physical well-being.",
        typicalCyclePhase: "Any",
        tips: [
            "Practice stress-management techniques, such as deep breathing exercises, meditation, or yoga, to help reduce stress levels.",
            "Engage in activities that bring you joy and help you relax, such as hobbies, spending time with loved ones, or being in nature.",
            "Consider seeking support from a trusted friend, counselor, or therapist if you're feeling overwhelmed by stress.", 
        ],
        shoppingList: null
    },

    "Sleep Disruption": {
        description: "Experiencing difficulty falling asleep, staying asleep, or having non-restorative sleep.",
        typicalCyclePhase: "Luteal phase",
        tips: [
            "Establish a consistent sleep schedule by going to bed and waking up at the same time each day.",
            "Create a relaxing bedtime routine, such as reading or taking a warm bath, to signal to your body that it's time to sleep.",
            "Limit exposure to screens and bright lights before bedtime, as they can interfere with your body's natural sleep-wake cycle. If sleep disruption persists, consider consulting a healthcare professional for further evaluation and treatment options.",
        ],
        shoppingList: null
    },

    "Medication Change": {
        description: "Experiencing changes in symptoms or side effects due to starting, stopping, or changing medications.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're experiencing changes in symptoms due to medication changes, it's important to communicate with your healthcare provider about any concerns or side effects you're experiencing.",
            "Make sure to follow your healthcare provider's instructions regarding medication use, and don't hesitate to ask questions or seek clarification if you're unsure about anything.",
            "Consider keeping a symptom diary to track any changes in symptoms or side effects related to medication changes, which can help you and your healthcare provider make informed decisions about your treatment plan.",
        ],
        shoppingList: null
    },

    "None": {
        description: "No birth control method used.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're not using any birth control method, it's important to be aware of your fertility and take appropriate precautions if you're trying to avoid pregnancy.", 
            "Consider tracking your menstrual cycle and fertility signs to better understand your reproductive health and make informed decisions about family planning.",
            "Focus on maintaining a healthy lifestyle, including regular exercise and a balanced diet, to support your overall well-being and reproductive health.",
        ],
        shoppingList: null
    },

    "Pill": {
        description: "Using oral contraceptive pills to prevent pregnancy.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using oral contraceptive pills, make sure to take them consistently and as directed by your healthcare provider to ensure their effectiveness.",
            "Be aware of potential side effects of oral contraceptive pills, such as changes in mood, weight, or menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider using a reminder system, such as an alarm or a pill organizer, to help you remember to take your pills at the same time each day.",
        ],
        shoppingList: null
    },

    "Missed Pill": {
        description: "Forgetting to take one or more doses of oral contraceptive pills.",
        typicalCyclePhase: "Any",
        tips: [
            "If you miss a pill, refer to the instructions provided with your specific brand of oral contraceptive pills for guidance on what to do next, as recommendations may vary based on the number of pills missed and the timing within your cycle.",
            "Consider using a backup method of contraception, such as condoms, if you miss a pill and are concerned about the risk of pregnancy.",
            "If you have any questions or concerns about missed pills or your contraceptive method, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },
   

    "IUD": {
        description: "Using an intrauterine device (IUD) for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have an IUD, it's important to check the strings regularly to ensure that the device is in place and functioning properly.",
            "Be aware of potential side effects of IUDs, such as changes in menstrual bleeding or cramping, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to ensure that your IUD is still in place and to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null
    },

    "Implant": {
        description: "Using a contraceptive implant for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you have a contraceptive implant, it's important to be aware of potential side effects, such as changes in menstrual bleeding or mood, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to ensure that your implant is still in place and to address any questions or concerns you may have about your contraceptive method.",
            "If you're considering getting a contraceptive implant, make sure to discuss the benefits and potential side effects with your healthcare provider to determine if it's the right choice for you.",
        ],
        shoppingList: null
    },

    "Injection": {
        description: "Using a contraceptive injection for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive injection, make sure to receive the injection on schedule, as recommended by your healthcare provider, to ensure its effectiveness.",
            "Be aware of potential side effects of contraceptive injections, such as changes in menstrual bleeding or mood, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null
    },

    "Patch": {
        description: "Using a contraceptive patch for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive patch, make sure to apply it to clean, dry skin on the upper arm, torso, or buttocks, and follow the schedule recommended by your healthcare provider for changing the patch.",
            "Be aware of potential side effects of contraceptive patches, such as skin irritation or changes in menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null
    },

    "Ring": {
        description: "Using a contraceptive vaginal ring for long-term contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive vaginal ring, make sure to insert it correctly and follow the schedule recommended by your healthcare provider for changing the ring.",
            "Be aware of potential side effects of contraceptive vaginal rings, such as vaginal irritation or changes in menstrual bleeding, and communicate with your healthcare provider if you have any concerns.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method.",
        ],
        shoppingList: null
    },

    "Condoms": {
        description: "Using condoms as a barrier method of contraception.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using condoms, make sure to use them consistently and correctly to ensure their effectiveness in preventing pregnancy and reducing the risk of sexually transmitted infections.",
            "Consider using a water-based or silicone-based lubricant with condoms to reduce the risk of breakage and increase comfort during sexual activity.",
            "If you have any questions or concerns about using condoms or other contraceptive methods, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Other": {
        description: "Using other forms of contraception or birth control methods.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using a contraceptive method that isn't listed here, make sure to follow the instructions provided by your healthcare provider or the manufacturer to ensure its effectiveness.",
            "Be aware of potential side effects of your chosen contraceptive method, and communicate with your healthcare provider if you have any concerns or experience any adverse effects.",
            "Consider scheduling regular check-ups with your healthcare provider to address any questions or concerns you may have about your contraceptive method and to ensure that it's still the right choice for you.",
        ],
        shoppingList: null
    },

    "Painkillers": {
        description: "Using painkillers, such as over-the-counter or prescription medications, to manage pain or discomfort.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using painkillers, make sure to follow the instructions provided by your healthcare provider or the medication label to ensure safe and effective use.",
            "Using painkillers can help manage symptoms such as menstrual cramps, headaches, or other types of pain that may occur during your cycle.",
            "If you have any questions or concerns about using painkillers or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Hormonal Medication": {
        description: "Using hormonal medications, such as birth control pills or hormone replacement therapy, to manage symptoms or regulate menstrual cycles.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using hormonal medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Hormonal medications can help manage symptoms such as irregular periods, heavy bleeding, or hormonal imbalances that may occur during your cycle.",
            "If you have any questions or concerns about using hormonal medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Antidepressants": {
        description: "Using antidepressant medications to manage symptoms of depression or anxiety that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antidepressants, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Antidepressants can help manage symptoms of depression or anxiety that may be related to hormonal changes during the menstrual cycle, such as premenstrual dysphoric disorder (PMDD).",
            "If you have any questions or concerns about using antidepressants or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Anti-Anxiety": {
        description: "Using anti-anxiety medications to manage symptoms of anxiety that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using anti-anxiety medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Anti-anxiety medications can help manage symptoms of anxiety that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using anti-anxiety medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Antipsychotics": {
        description: "Using antipsychotic medications to manage symptoms of psychosis or other mental health conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antipsychotic medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Antipsychotic medications can help manage symptoms of psychosis or other mental health conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using antipsychotic medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Antihistamines": {
        description: "Using antihistamine medications to manage symptoms of allergies or other conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using antihistamines, make sure to follow the instructions provided by your healthcare provider or the medication label to ensure safe and effective use.",
            "Antihistamines can help manage symptoms of allergies or other conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using antihistamines or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "HRT": {
        description: "Using hormone replacement therapy (HRT) to manage symptoms of menopause or other hormonal imbalances.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using hormone replacement therapy, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Hormone replacement therapy can help manage symptoms of menopause or other hormonal imbalances, such as hot flashes, night sweats, or mood changes.",
            "If you have any questions or concerns about using hormone replacement therapy or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Benzos": {
        description: "Using benzodiazepine medications to manage symptoms of anxiety or other conditions that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using benzodiazepine medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Benzo medications can help manage symptoms of anxiety or other conditions that may be related to hormonal changes during the menstrual cycle.",
            "If you have any questions or concerns about using benzodiazepine medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Mood Stabilizers": {
        description: "Using mood stabilizer medications to manage symptoms of mood disorders that may be related to hormonal changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using mood stabilizer medications, make sure to follow the instructions provided by your healthcare provider to ensure safe and effective use.",
            "Mood stabilizers can help manage symptoms of mood disorders that may be related to hormonal changes during the menstrual cycle, such as bipolar disorder or premenstrual dysphoric disorder (PMDD).",
            "If you have any questions or concerns about using mood stabilizer medications or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null

    },

    "Vitamins": {
        description: "Taking vitamins or supplements to support overall health and well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking vitamins or supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Certain vitamins and supplements, such as iron, magnesium, or vitamin B6, may be particularly beneficial during certain phases of the menstrual cycle to help manage symptoms or support overall health.",
            "If you have any questions or concerns about taking vitamins or supplements, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Magnesium": {
        description: "Taking magnesium supplements to help manage symptoms such as cramps, headaches, or mood changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking magnesium supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Magnesium can help manage symptoms such as cramps, headaches, or mood changes that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking magnesium supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Zinc": {
        description: "Taking zinc supplements to support immune function and overall health during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking zinc supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",   
            "Zinc can help support immune function and overall health during the menstrual cycle.",
            "If you have any questions or concerns about taking zinc supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Iron": {
        description: "Taking iron supplements to help manage symptoms of anemia or heavy menstrual bleeding during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking iron supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Iron can help manage symptoms of anemia or heavy menstrual bleeding that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking iron supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Omega 3": {
        description: "Taking omega-3 supplements to help manage symptoms such as cramps, inflammation, or mood changes during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking omega-3 supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Omega-3 can help manage symptoms such as cramps, inflammation, or mood changes that may occur during the menstrual cycle.",
            "If you have any questions or concerns about taking omega-3 supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Probiotics": {
        description: "Taking probiotic supplements to support gut health and overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking probiotic supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Probiotics can help support gut health and overall well-being during the menstrual cycle.",    
            "If you have any questions or concerns about taking probiotic supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Adaptogens": {
        description: "Taking adaptogenic supplements, such as ashwagandha or rhodiola, to help manage stress and support overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're taking adaptogenic supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Adaptogens can help manage stress and support overall well-being during the menstrual cycle.",
            "If you have any questions or concerns about taking adaptogenic supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    },

    "Protein Powder": {
        description: "Using protein powder supplements to support muscle recovery and overall health during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using protein powder supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Protein powder can help support muscle recovery and overall health during the menstrual cycle, especially if you're engaging in regular exercise.",
            "If you have any questions or concerns about using protein powder supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ], 
        shoppingList: null
    },

    "Fiber Supplements": {
        description: "Using fiber supplements to support digestive health and overall well-being during the menstrual cycle.",
        typicalCyclePhase: "Any",
        tips: [
            "If you're using fiber supplements, make sure to follow the instructions provided by your healthcare provider or the supplement label to ensure safe and effective use.",
            "Fiber supplements can help support digestive health and overall well-being during the menstrual cycle, especially if you're experiencing digestive symptoms such as bloating or constipation.",
            "If you have any questions or concerns about using fiber supplements or if you experience any adverse effects, don't hesitate to contact your healthcare provider for guidance and support.",
        ],
        shoppingList: null
    }

};
