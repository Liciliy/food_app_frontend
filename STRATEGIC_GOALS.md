# Food Tracker - Strategic Goals

## 🎯 Long-Term Vision & Features

### Dynamic UI & Personalization
- [ ] **Dynamic UI Configuration System**
  - Allow users to select which UI elements to see
  - Enable customization of element locations and positions
  - Implement UI presets:
    - **Light**: Minimal info, clean interface
    - **Medium**: Balanced info display
    - **Overloaded**: All available information and charts
  - Create intro questionnaire to understand user preferences and automatically suggest appropriate preset
  - Save user preferences and allow switching between presets
  - Drag-and-drop dashboard customization

### Smart Notifications & Reminders
- [ ] **Meal Recording Reminders**
  - Implement intelligent meal time reminders based on typical eating hours
  - Send notifications to remind users to record meals at logical times (breakfast, lunch, dinner, snacks)
  - Adapt reminder times based on user's historical eating patterns
  - Allow users to customize reminder settings

### Personalized Nutrition Goals
- [ ] **Smart Nutrition Target Calculation**
  - Display real-time calculation of what user has eaten today vs. what they still need to consume (calories, fat, carbs, protein)
  - Implement onboarding questionnaire during registration:
    - Collect user's weight (voice or text input)
    - Ask about health problems or concerns
    - Understand user's goals (build muscle, lose weight, maintain, etc.)
    - Assess activity level (sedentary, gym, running, walking, etc.)
  - Use LLM to calculate personalized daily nutrition norms based on collected information
  - Provide progressive feedback throughout the day on nutrition targets
  - Recalculate norms dynamically based on user progress and changing goals
