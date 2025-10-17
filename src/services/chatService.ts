import { API_CONFIG, getDefaultHeaders } from '../config/api';

// Servicio para manejar la comunicación con la API
export class ChatService {
  private apiUrl: string;

  constructor(apiUrl: string = API_CONFIG.BASE_URL) {
    this.apiUrl = apiUrl;
  }

  async sendMessage(message: string): Promise<string> {
    // Usar la API real si está configurada, sino simular
    if (this.apiUrl) {
      try {
        return await this.sendMessageToAPI(message);
      } catch (error) {
        console.error('Error con API, usando respuesta simulada:', error);
        return this.simulateAIResponse(message);
      }
    }
    return this.simulateAIResponse(message);
  }

  private async simulateAIResponse(message: string): Promise<string> {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = message.toLowerCase();
    
    // Respuestas simuladas basadas en temas comunes de maternidad
    if (lowerMessage.includes('embarazo') || lowerMessage.includes('embarazada')) {
      const responses = [
        'Durante el embarazo es importante mantener una dieta equilibrada rica en ácido fólico, hierro y calcio. ¿Tienes alguna duda específica sobre nutrición en el embarazo?',
        'El embarazo se divide en tres trimestres. Cada uno tiene sus particularidades. ¿En qué trimestre te encuentras o sobre cuál te gustaría saber más?',
        'Es normal sentir diversos síntomas durante el embarazo como náuseas, cansancio o cambios emocionales. ¿Hay algún síntoma específico que te preocupe?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('parto') || lowerMessage.includes('nacimiento')) {
      const responses = [
        'Existen diferentes tipos de parto: natural, con epidural, por cesárea. Cada uno tiene sus ventajas. ¿Te gustaría conocer más sobre alguno en particular?',
        'Las contracciones regulares cada 3-5 minutos que duran 45-60 segundos suelen indicar que es momento de ir al hospital. ¿Tienes dudas sobre cuándo acudir?',
        'Es importante tener preparado tu bolso para el hospital con anticipación. ¿Necesitas ayuda con la lista de cosas para llevar?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('lactancia') || lowerMessage.includes('amamantar')) {
      const responses = [
        'La lactancia materna es beneficiosa tanto para el bebé como para la madre. Es normal tener dificultades al principio. ¿Qué aspecto de la lactancia te preocupa?',
        'Una buena técnica de agarre es fundamental para una lactancia exitosa. El bebé debe abarcar toda la areola, no solo el pezón.',
        'Es recomendable amamantar a demanda durante las primeras semanas para establecer bien la producción de leche.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('puerperio') || lowerMessage.includes('postparto')) {
      const responses = [
        'El puerperio es un período de adaptación tanto física como emocional. Es normal sentirse abrumada. ¿Hay algo específico que te esté preocupando?',
        'Durante el puerperio es importante descansar, alimentarse bien y pedir ayuda cuando la necesites. El apoyo familiar es fundamental.',
        'Los cambios hormonales postparto pueden afectar el estado de ánimo. Si sientes tristeza persistente, es importante consultar con un profesional.'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('dolor') || lowerMessage.includes('molestia')) {
      return 'Entiendo tu preocupación por el dolor. Aunque puedo darte información general, siempre es importante consultar con tu médico para síntomas específicos. ¿Podrías describir mejor qué tipo de molestia sientes?';
    }

    // Respuesta por defecto
    const defaultResponses = [
      'Entiendo tu consulta. Como asistente especializado en maternidad, puedo ayudarte con dudas sobre embarazo, parto, lactancia y puerperio. ¿Podrías ser más específica sobre qué te gustaría saber?',
      'Estoy aquí para apoyarte en tu proceso de maternidad. ¿Hay algún tema específico sobre embarazo, parto o cuidado del bebé que te interese?',
      'Cada experiencia de maternidad es única. ¿Podrías contarme más detalles sobre tu situación para poder darte información más personalizada?'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Método para enviar mensaje a tu API real
  private async sendMessageToAPI(message: string): Promise<string> {
    if (!this.apiUrl) {
      throw new Error('API URL no configurada');
    }

    try {
      const response = await fetch(`${this.apiUrl}${API_CONFIG.ENDPOINTS.ASK_PUBLIC}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ 
          question: message 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      // Asumiendo que tu API retorna la respuesta en un campo específico
      // Ajusta según la estructura de respuesta de tu API
      return data.answer || data.response || data.message || JSON.stringify(data);
    } catch (error) {
      console.error('Error enviando mensaje a API:', error);
      throw new Error('No se pudo conectar con la API. Verificando conexión...');
    }
  }
}